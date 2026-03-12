import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { getModelDef } from "@/lib/services/ai/models";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildImageEditPrompt, buildSeedreamPrompt } from "@/lib/services/ai/prompts";
import {
  getUserCreditInfo,
  deductCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { upscaleImages } from "@/lib/services/ai/upscaler";
import { uploadFileToReplicate } from "@/lib/services/ai/replicate-files";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

interface GenerateResponse {
  outputUrls: string[];
  previewUrls?: string[];
  creditsUsed: number;
  balanceAfter: number;
}

export const POST = withAuth(async (request, { user }) => {
  // 1. FormData 파싱
  const formData = await request.formData();

  const modelId = formData.get("modelId") as string;
  const prompt = formData.get("prompt") as string;
  const imageSize = formData.get("imageSize") as string;
  const ratio = formData.get("ratio") as string;
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const scale = Number(formData.get("scale"));
  const imageCount = Number(formData.get("imageCount"));

  // 기본 검증
  if (!modelId || !prompt || prompt.length < 1 || prompt.length > 2000) {
    throw new ValidationError("입력값이 올바르지 않습니다");
  }
  if (!["1K", "2K", "3K", "4K", "custom"].includes(imageSize)) {
    throw new ValidationError("이미지 크기가 올바르지 않습니다");
  }
  if (imageCount < 1 || imageCount > 4) {
    throw new ValidationError("이미지 수는 1~4장이어야 합니다");
  }

  // 2. 모델 설정 조회
  const modelDef = getModelDef(modelId);
  if (!modelDef) {
    throw new ApiError(`지원하지 않는 모델입니다: ${modelId}`, 400);
  }

  // 3. 이미지 파일 처리 (Replicate Files 업로드 or data URI 변환)
  const imageEntries = formData.getAll("images");
  const images: string[] = await Promise.all(
    imageEntries.map(async (entry) => {
      if (entry instanceof File) {
        if (modelDef.provider === "replicate") {
          return uploadFileToReplicate(entry, entry.name);
        }
        // 비-Replicate 프로바이더: 서버에서 data URI 변환 (Node.js Buffer는 빠름)
        const buffer = Buffer.from(await entry.arrayBuffer());
        return `data:${entry.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
      return entry as string;
    })
  );

  // 참조 이미지 수 검증
  if (images.length > modelDef.maxImages) {
    throw new ValidationError(
      `${modelDef.label}은 최대 ${modelDef.maxImages}개의 참조 이미지를 지원합니다`
    );
  }

  // 이미지 생성 수 (maxOutputs 제한 없이 요청 수 그대로 사용)
  const actualCount = imageCount;

  // 4. 크레딧 + 플랜 정보 조회
  const creditInfo = await getUserCreditInfo(user.id);
  const creditCost =
    (Math.max(width, height) > 2048 ? 150 : 75) * actualCount;

  // 쿨다운 검증
  const cooldownRemaining = checkCooldown(
    creditInfo.lastGenerationAt,
    creditInfo.plan.cooldownSeconds
  );
  if (cooldownRemaining > 0) {
    throw new ValidationError(
      `${Math.ceil(cooldownRemaining / 60)}분 후에 다시 시도해주세요`
    );
  }

  // 배치 크기 검증
  if (actualCount > creditInfo.plan.maxBatchSize) {
    throw new ValidationError(
      `${creditInfo.plan.name} 플랜은 한 번에 최대 ${creditInfo.plan.maxBatchSize}장까지 생성할 수 있습니다`
    );
  }

  // 잔액 사전확인 (fast-fail)
  if (creditInfo.balance.total < creditCost) {
    throw new CreditError(
      "크레딧이 부족합니다",
      creditCost,
      creditInfo.balance.total
    );
  }

  // 5. AI 생성 호출 — 개발 환경 dry-run 모드
  const isDryRun = process.env.DRY_RUN === "true";
  if (isDryRun) {
    const body: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        outputUrls: Array(actualCount).fill(
          "https://placehold.co/1024x1024/1a1a2e/white?text=DRY+RUN"
        ),
        creditsUsed: 0,
        balanceAfter: creditInfo.balance.total,
      },
    };
    return NextResponse.json(body);
  }

  const provider = resolveProvider({
    provider: modelDef.provider,
    modelId: modelDef.modelId,
    version: modelDef.version,
  });

  const modelConfig = {
    provider: modelDef.provider,
    modelId: modelDef.modelId,
    version: modelDef.version,
    defaults: modelDef.defaults,
  };

  // 모델이 N장 동시 생성 가능하면 한 번에, 아니면 병렬 호출
  const perCallCount = Math.min(actualCount, modelDef.maxOutputs);
  const callCount = Math.ceil(actualCount / perCallCount);

  const isSeedream = modelId.startsWith("seedream");
  const generateOne = (count: number) => {
    const builtPrompt = isSeedream
      ? buildSeedreamPrompt(prompt, images.length > 0)
      : buildImageEditPrompt(prompt);
    const modelInput = modelDef.buildInput({
      prompt: builtPrompt,
      images: images.length > 0 ? images : undefined,
      width,
      height,
      ratio,
      imageCount: count,
      imageSize,
    });
    return provider.generate(modelConfig, {
      prompt: modelInput.prompt as string,
      params: modelInput,
    });
  };

  // stagger 방식: 요청 간 1초 간격으로 발사 후 전체 대기
  const resultPromises: ReturnType<typeof generateOne>[] = [];
  for (let i = 0; i < callCount; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    const remaining = actualCount - i * perCallCount;
    resultPromises.push(generateOne(Math.min(perCallCount, remaining)));
  }
  const results = await Promise.all(resultPromises);

  let allOutputUrls = results.flatMap((r) => r.outputUrls);
  const preUpscaleUrls = [...allOutputUrls];

  // 6. 필요 시 업스케일 (모델이 지원하지 않는 해상도이거나 scale > 1)
  const needsUpscale =
    !modelDef.supportedSizes.includes(imageSize) || scale > 1;

  if (needsUpscale) {
    // imageSize 기준 목표 해상도
    const targetPixels = imageSize === "4K" ? 4096 : imageSize === "3K" ? 3072 : imageSize === "2K" ? 2048 : 1024;
    const maxSupported = modelDef.supportedSizes.includes("4K")
      ? 4096
      : modelDef.supportedSizes.includes("3K")
        ? 3072
        : modelDef.supportedSizes.includes("2K")
          ? 2048
          : 1024;
    const sizeRatio = targetPixels / maxSupported;

    // scale은 직접 배율 (1~4)
    const scaleFactor = Math.max(
      sizeRatio > 1 ? Math.ceil(sizeRatio) : 1,
      scale > 1 ? Math.round(scale) : 1
    );

    if (scaleFactor >= 2) {
      allOutputUrls = await upscaleImages(
        allOutputUrls,
        Math.min(scaleFactor, 4)
      );
    }
  }

  // 7. 원자적 크레딧 차감 (성공 후)
  const deductResult = await deductCredits(
    user.id,
    creditCost,
    `이미지 생성 (${modelDef.label}, ${actualCount}장)`,
    { modelId, imageCount: actualCount, width, height }
  );

  if (!deductResult.success) {
    throw new CreditError(
      "크레딧이 부족합니다",
      deductResult.required ?? creditCost,
      deductResult.available ?? 0
    );
  }

  // 8. 히스토리 즉시 저장 (임시 URL) → 백그라운드로 Storage 업로드 후 영구 URL로 UPDATE
  const supabaseAdmin = createAdminClient();
  const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generation-outputs`;
  const hasUpscaled = allOutputUrls.some((url, i) => url !== preUpscaleUrls[i]);
  const historyPayload = {
    user_id: user.id,
    feature_type: "image-edit" as const,
    model_id: modelId,
    prompt,
    input_urls: images.filter((s) => s.startsWith("http")) ?? [],
    output_urls: allOutputUrls,
    preview_urls: hasUpscaled ? preUpscaleUrls : [],
    credits_used: creditCost,
    metadata: { width, height, ratio, imageSize, scale, imageCount },
  };

  const { data: historyRow } = await supabaseAdmin
    .from("generation_history")
    .insert(historyPayload)
    .select("id")
    .single();

  // 백그라운드: Storage 업로드 후 영구 URL로 교체 (output + preview)
  if (historyRow) {
    const uploadToStorage = async (url: string, suffix: string) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${Date.now()}-${suffix}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from("generation-outputs")
          .upload(path, blob, {
            contentType: blob.type,
            upsert: false,
          });

        if (error) {
          console.error("[storage] upload failed:", error);
          return url;
        }
        return `${storageBaseUrl}/${path}`;
      } catch {
        return url;
      }
    };

    (async () => {
      try {
        const permanentUrls = await Promise.all(
          allOutputUrls.map((url, i) => uploadToStorage(url, `out-${i}`))
        );

        const updatePayload: Record<string, unknown> = { output_urls: permanentUrls };

        // 업스케일된 경우 1K preview도 영구 저장
        if (hasUpscaled) {
          const permanentPreviews = await Promise.all(
            preUpscaleUrls.map((url, i) => uploadToStorage(url, `preview-${i}`))
          );
          updatePayload.preview_urls = permanentPreviews;
        }

        await supabaseAdmin
          .from("generation_history")
          .update(updatePayload)
          .eq("id", historyRow.id);
      } catch (err) {
        console.error("[storage] background upload failed:", err);
      }
    })();
  }

  // 9. 응답 (Storage 업로드 완료를 기다리지 않음)
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      outputUrls: allOutputUrls,
      ...(hasUpscaled && { previewUrls: preUpscaleUrls }),
      creditsUsed: creditCost,
      balanceAfter: deductResult.totalBalance ?? 0,
    },
  };

  return NextResponse.json(body);
});

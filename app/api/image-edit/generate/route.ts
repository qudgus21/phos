import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { imageGenerationSchema } from "@/lib/validations/image-generation";
import { getModelDef } from "@/lib/services/ai/models";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildImageEditPrompt } from "@/lib/services/ai/prompts";
import {
  getUserCreditInfo,
  deductCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { upscaleImages } from "@/lib/services/ai/upscaler";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

interface GenerateResponse {
  outputUrls: string[];
  creditsUsed: number;
  balanceAfter: number;
}

export const POST = withAuth(async (request, { user }) => {
  // 1. Body 파싱 & 검증
  const raw = await request.json();
  const parsed = imageGenerationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    throw new ValidationError("입력값이 올바르지 않습니다", fieldErrors);
  }

  const { modelId, prompt, images, width, height, imageCount, ratio, imageSize, scale } = parsed.data;

  // 2. 모델 설정 조회
  const modelDef = getModelDef(modelId);
  if (!modelDef) {
    throw new ApiError(`지원하지 않는 모델입니다: ${modelId}`, 400);
  }

  // 참조 이미지 수 검증
  if (images && images.length > modelDef.maxImages) {
    throw new ValidationError(
      `${modelDef.label}은 최대 ${modelDef.maxImages}개의 참조 이미지를 지원합니다`
    );
  }

  // 이미지 생성 수 (maxOutputs 제한 없이 요청 수 그대로 사용)
  const actualCount = imageCount;

  // 3. 크레딧 + 플랜 정보 조회
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

  // 4. AI 생성 호출 — 개발 환경 dry-run 모드
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

  const generateOne = (count: number) => {
    const modelInput = modelDef.buildInput({
      prompt: buildImageEditPrompt(prompt),
      images: images && images.length > 0 ? images : undefined,
      width,
      height,
      ratio,
      imageCount: count,
    });
    return provider.generate(modelConfig, {
      prompt: modelInput.prompt as string,
      params: modelInput,
    });
  };

  const results = await Promise.all(
    Array.from({ length: callCount }, (_, i) => {
      const remaining = actualCount - i * perCallCount;
      return generateOne(Math.min(perCallCount, remaining));
    })
  );

  let allOutputUrls = results.flatMap((r) => r.outputUrls);

  // 5. 필요 시 업스케일 (모델이 지원하지 않는 해상도이거나 scale > 0)
  const needsUpscale =
    !modelDef.supportedSizes.includes(imageSize) || scale > 0;

  if (needsUpscale) {
    // scale 범위: -2 ~ 2 → upscale factor: 2 or 4
    // 모델 미지원 해상도: 1K→2K = x2, 1K→4K = x4, 2K→4K = x2
    const maxSupported = modelDef.supportedSizes.includes("4K")
      ? 4096
      : modelDef.supportedSizes.includes("2K")
        ? 2048
        : 1024;
    const targetMax = Math.max(width, height);
    const sizeRatio = targetMax / maxSupported;

    // scale > 0이면 추가 배율, 아니면 해상도 보정만
    const scaleFactor = Math.max(
      sizeRatio > 1 ? Math.ceil(sizeRatio) : 1,
      scale > 0 ? 2 : 1
    );

    if (scaleFactor >= 2) {
      allOutputUrls = await upscaleImages(
        allOutputUrls,
        Math.min(scaleFactor, 4)
      );
    }
  }

  // 6. 원자적 크레딧 차감 (성공 후)
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

  // 7. Storage에 결과 이미지 업로드 + 히스토리 저장 (비동기)
  const supabaseAdmin = createAdminClient();
  const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generation-outputs`;

  (async () => {
    try {
      // AI 프로바이더 임시 URL → Supabase Storage 영구 URL
      const permanentUrls = await Promise.all(
        allOutputUrls.map(async (url, i) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
            const path = `${user.id}/${Date.now()}-${i}.${ext}`;

            const { error } = await supabaseAdmin.storage
              .from("generation-outputs")
              .upload(path, blob, {
                contentType: blob.type,
                upsert: false,
              });

            if (error) {
              console.error("[storage] upload failed:", error);
              return url; // 실패 시 원본 URL 유지
            }
            return `${storageBaseUrl}/${path}`;
          } catch {
            return url; // fetch 실패 시 원본 URL 유지
          }
        })
      );

      await supabaseAdmin
        .from("generation_history")
        .insert({
          user_id: user.id,
          feature_type: "image-edit",
          model_id: modelId,
          prompt,
          input_urls: images?.filter((s) => s.startsWith("http")) ?? [],
          output_urls: permanentUrls,
          credits_used: creditCost,
          metadata: { width, height, ratio, imageSize, scale, imageCount },
        });
    } catch (err) {
      console.error("[generation_history] save failed:", err);
    }
  })();

  // 8. 응답 (Storage 업로드 완료를 기다리지 않음)
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      outputUrls: allOutputUrls,
      creditsUsed: creditCost,
      balanceAfter: deductResult.totalBalance ?? 0,
    },
  };

  return NextResponse.json(body);
});

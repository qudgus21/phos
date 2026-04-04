import { NextResponse, after } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { getModelDef, getImageEditCredits } from "@/lib/services/ai/models";
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
import { runGenerationInBackground } from "@/lib/services/generation/background";
import { CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

interface GenerateResponse {
  historyId: string;
  creditsUsed: number;
  balanceAfter: number;
  status: "pending";
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
  if (!modelId) {
    throw new ValidationError("Please select a model");
  }
  if (!prompt || prompt.length < 1) {
    throw new ValidationError("Please enter a prompt");
  }
  if (prompt.length > 2000) {
    throw new ValidationError("Prompt must be 2,000 characters or less");
  }
  if (!["1K", "2K", "3K", "4K", "custom"].includes(imageSize)) {
    throw new ValidationError("Invalid image size");
  }
  if (imageCount < 1 || imageCount > 4) {
    throw new ValidationError("Image count must be between 1 and 4");
  }
  if (isNaN(width) || isNaN(height) || isNaN(scale)) {
    throw new ValidationError("Invalid size/scale value");
  }

  // 2. 모델 설정 조회
  const modelDef = getModelDef(modelId);
  if (!modelDef) {
    throw new ValidationError("Unsupported model");
  }

  // 3. 이미지 파일 처리 (응답 전에 완료해야 함 — after() 이후 FormData 접근 불가)
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const imageEntries = formData.getAll("images");
  const images: string[] = await Promise.all(
    imageEntries.map(async (entry) => {
      if (entry instanceof File) {
        if (entry.size > MAX_FILE_SIZE) {
          throw new ValidationError(
            `File size must be ${MAX_FILE_SIZE / 1024 / 1024} MB or less`
          );
        }
        if (modelDef.provider === "replicate") {
          return uploadFileToReplicate(entry, entry.name);
        }
        const buffer = Buffer.from(await entry.arrayBuffer());
        return `data:${entry.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
      return entry as string;
    })
  );

  // 참조 이미지 수 검증
  if (images.length > modelDef.maxImages) {
    throw new ValidationError(
      `${modelDef.label} supports up to ${modelDef.maxImages} reference images`
    );
  }

  // 4. 크레딧 + 플랜 정보 조회
  const creditInfo = await getUserCreditInfo(user.id);
  const perImage = getImageEditCredits(modelId, imageSize);
  const creditCost = perImage * imageCount;

  const cooldownRemaining = checkCooldown(
    creditInfo.lastGenerationAt,
    creditInfo.plan.cooldownSeconds
  );
  if (cooldownRemaining > 0) {
    throw new ValidationError(
      `Please wait ${Math.ceil(cooldownRemaining / 60)} minutes before trying again`
    );
  }

  if (imageCount > creditInfo.plan.maxBatchSize) {
    throw new ValidationError(
      `${creditInfo.plan.name} plan allows up to ${creditInfo.plan.maxBatchSize} images per batch`
    );
  }

  // 5. dry-run 모드
  const isDryRun = process.env.DRY_RUN === "true";
  if (isDryRun) {
    const body: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        historyId: crypto.randomUUID(),
        creditsUsed: 0,
        balanceAfter: creditInfo.balance.total,
        status: "pending",
      },
    };
    return NextResponse.json(body);
  }

  // 6. 선차감
  const deductResult = await deductCredits(
    user.id,
    creditCost,
    `Image generation (${modelDef.label}, ${imageCount} images)`,
    { modelId, imageCount, width, height }
  );

  if (!deductResult.success) {
    throw new CreditError(
      "Insufficient credits",
      deductResult.required ?? creditCost,
      deductResult.available ?? 0
    );
  }

  // 7. pending 상태로 히스토리 INSERT
  const supabaseAdmin = createAdminClient();
  const { data: historyRow, error: historyError } = await supabaseAdmin
    .from("generation_history")
    .insert({
      user_id: user.id,
      feature_type: "image-edit" as const,
      model_id: modelId,
      prompt,
      input_urls: images.filter((s) => s.startsWith("http")),
      display_urls: [],
      original_urls: [],
      credits_used: creditCost,
      metadata: { width, height, ratio, imageSize, scale, imageCount },
      status: "pending",
      onetime_deducted: deductResult.onetimeDeducted ?? 0,
      subscription_deducted: deductResult.subscriptionDeducted ?? 0,
    })
    .select("id")
    .single();

  if (historyError) {
    console.error("[generate] history insert failed:", historyError);
    throw new Error("Failed to save history");
  }

  // 8. 즉시 응답 반환
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      historyId: historyRow.id,
      creditsUsed: creditCost,
      balanceAfter: deductResult.totalBalance ?? 0,
      status: "pending",
    },
  };

  // 9. 백그라운드에서 AI 생성 실행
  after(() =>
    runGenerationInBackground({
      historyId: historyRow.id,
      userId: user.id,
      modelLabel: modelDef.label,
      imageCount,
      onetimeDeducted: deductResult.onetimeDeducted ?? 0,
      subscriptionDeducted: deductResult.subscriptionDeducted ?? 0,
      generateFn: async () => {
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

        const perCallCount = Math.min(imageCount, modelDef.maxOutputs);
        const callCount = Math.ceil(imageCount / perCallCount);

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

        const resultPromises: ReturnType<typeof generateOne>[] = [];
        for (let i = 0; i < callCount; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 1000));
          const remaining = imageCount - i * perCallCount;
          resultPromises.push(generateOne(Math.min(perCallCount, remaining)));
        }
        const results = await Promise.all(resultPromises);

        let allOutputUrls = results.flatMap((r) => r.outputUrls);

        // 업스케일
        const maxScale =
          imageSize === "4K" || imageSize === "3K" ? 1
            : imageSize === "2K" ? 2
            : 4;

        const effectiveScale = Math.min(
          scale > 1 ? Math.round(scale) : 1,
          maxScale
        );

        if (effectiveScale >= 2) {
          allOutputUrls = await upscaleImages(allOutputUrls, effectiveScale);
        }

        return allOutputUrls;
      },
    })
  );

  return NextResponse.json(body);
});

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { getRetouchingModelDef } from "@/lib/services/ai/models";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildSkinRetouchPrompt } from "@/lib/services/ai/prompts";
import type { SkinRetouchOptions } from "@/lib/services/ai/prompts";
import {
  getUserCreditInfo,
  deductCredits,
  refundCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { uploadFileToReplicate } from "@/lib/services/ai/replicate-files";
import { upscaleImages } from "@/lib/services/ai/upscaler";
import { createAdminClient } from "@/lib/supabase/admin";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { ApiError, CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

const lambda: LambdaClient =
  (globalThis as Record<string, unknown>).__lambdaClient as LambdaClient ??
  ((globalThis as Record<string, unknown>).__lambdaClient = new LambdaClient({ region: "us-east-2" }));

const CREDIT_COST = 80;
const DEFAULT_MODEL_ID = "retouching-gpt-image-1.5";

interface GenerateResponse {
  outputUrls: string[];
  inputImageUrl: string | null;
  creditsUsed: number;
  balanceAfter: number;
  historyId: string | null;
}

const VALID_FILTERS = ["none", "studio", "brightening", "glow"] as const;
const VALID_GENDERS = ["female", "male"] as const;
const VALID_MODES = ["natural", "soft-makeup", "matte"] as const;
const VALID_AREAS = ["lips", "eyebrows", "nose", "hair", "background", "clothes"] as const;


export const POST = withAuth(async (request, { user }) => {
  // 1. FormData 파싱
  const formData = await request.formData();

  const imageFile = formData.get("image") as File | null;
  const filter = formData.get("filter") as string;
  const filterIntensity = Number(formData.get("filterIntensity") ?? 0.5);
  const gender = formData.get("gender") as string;
  const mode = formData.get("mode") as string;
  const excludedAreasRaw = formData.get("excludedAreas") as string;
  const faceReshape = formData.get("faceReshape") === "true";
  const faceReshapeIntensity = Number(formData.get("faceReshapeIntensity") ?? 0.5);
  const outputSize = formData.get("outputSize") as string;
  const ratio = formData.get("ratio") as string;
  const scale = Number(formData.get("scale") ?? 1);

  // 2. 유효성 검증
  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    throw new ValidationError("이미지를 업로드해주세요");
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (imageFile.size > MAX_FILE_SIZE) {
    throw new ValidationError(`파일 크기는 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 허용됩니다`);
  }

  if (!VALID_FILTERS.includes(filter as typeof VALID_FILTERS[number])) {
    throw new ValidationError("올바르지 않은 필터입니다");
  }
  if (!VALID_GENDERS.includes(gender as typeof VALID_GENDERS[number])) {
    throw new ValidationError("올바르지 않은 성별입니다");
  }
  if (!VALID_MODES.includes(mode as typeof VALID_MODES[number])) {
    throw new ValidationError("올바르지 않은 모드입니다");
  }
  if (!["auto", "2K", "4K"].includes(outputSize)) {
    throw new ValidationError("올바르지 않은 출력 크기입니다");
  }

  const excludedAreas = excludedAreasRaw
    ? excludedAreasRaw.split(",").filter((a) => VALID_AREAS.includes(a as typeof VALID_AREAS[number]))
    : [];

  // 3. 모델 설정
  const modelDef = getRetouchingModelDef(DEFAULT_MODEL_ID);
  if (!modelDef) {
    throw new ApiError(`지원하지 않는 모델입니다: ${DEFAULT_MODEL_ID}`, 400);
  }

  // 4. 프롬프트 생성
  const retouchOptions: SkinRetouchOptions = {
    filter: filter as SkinRetouchOptions["filter"],
    filterIntensity: Math.max(0, Math.min(1, filterIntensity)),
    gender: gender as SkinRetouchOptions["gender"],
    mode: mode as SkinRetouchOptions["mode"],
    excludedAreas,
    faceReshape,
    faceReshapeIntensity: Math.max(0, Math.min(1, faceReshapeIntensity)),
  };
  const builtPrompt = buildSkinRetouchPrompt(retouchOptions);
  console.log("[retouching] prompt:", builtPrompt);

  // 5. 이미지 업로드 (Replicate Files) — 클라이언트에서 1024px WebP 변환 완료
  const imageUrl = await uploadFileToReplicate(imageFile, imageFile.name);

  // 6. 크레딧 + 플랜 정보 조회
  const creditInfo = await getUserCreditInfo(user.id);

  const cooldownRemaining = checkCooldown(
    creditInfo.lastGenerationAt,
    creditInfo.plan.cooldownSeconds
  );
  if (cooldownRemaining > 0) {
    throw new ValidationError(
      `${Math.ceil(cooldownRemaining / 60)}분 후에 다시 시도해주세요`
    );
  }

  // 7. DRY_RUN 모드
  const isDryRun = process.env.DRY_RUN === "true";
  if (isDryRun) {
    const body: ApiResponse<GenerateResponse> = {
      success: true,
      data: {
        outputUrls: ["https://placehold.co/1024x1024/1a1a2e/white?text=DRY+RUN+RETOUCH"],
        inputImageUrl: null,
        creditsUsed: 0,
        balanceAfter: creditInfo.balance.total,
        historyId: null,
      },
    };
    return NextResponse.json(body);
  }

  // 8. 선차감
  const deductResult = await deductCredits(
    user.id,
    CREDIT_COST,
    `리터칭 (${modelDef.label})`,
    { modelId: DEFAULT_MODEL_ID, filter, mode, gender }
  );

  if (!deductResult.success) {
    throw new CreditError(
      "크레딧이 부족합니다",
      deductResult.required ?? CREDIT_COST,
      deductResult.available ?? 0
    );
  }

  // 9. AI 생성 (실패 시 환불)
  let allOutputUrls: string[];
  try {
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

    const modelInput = modelDef.buildInput({
      prompt: builtPrompt,
      images: [imageUrl],
      width: 0,
      height: 0,
      ratio,
      imageCount: 1,
      imageSize: outputSize,
    });

    const result = await provider.generate(modelConfig, {
      prompt: modelInput.prompt as string,
      params: modelInput,
    });

    allOutputUrls = result.outputUrls;

    // 업스케일 (GPT Image 1.5는 항상 ~1K 출력 → 최대 4x까지)
    const effectiveScale = Math.min(
      scale > 1 ? Math.round(scale) : 1,
      4
    );
    if (effectiveScale >= 2) {
      allOutputUrls = await upscaleImages(allOutputUrls, effectiveScale);
    }
  } catch (err) {
    console.error("[retouching] AI generation failed, refunding credits:", err);
    await refundCredits(
      user.id,
      deductResult.onetimeDeducted ?? 0,
      deductResult.subscriptionDeducted ?? 0,
      `리터칭 실패 환불 (${modelDef.label})`,
      { modelId: DEFAULT_MODEL_ID, reason: err instanceof Error ? err.message : "unknown" }
    );
    throw err;
  }

  // 10. 히스토리 저장
  const supabaseAdmin = createAdminClient();
  const historyPayload = {
    user_id: user.id,
    feature_type: "retouching" as const,
    model_id: DEFAULT_MODEL_ID,
    prompt: builtPrompt,
    input_urls: [imageUrl],
    display_urls: allOutputUrls,
    original_urls: allOutputUrls,
    credits_used: CREDIT_COST,
    metadata: {
      filter,
      filterIntensity,
      gender,
      mode,
      excludedAreas,
      faceReshape,
      faceReshapeIntensity,
      outputSize,
      ratio,
      scale,
    },
  };

  const { data: historyRow, error: historyError } = await supabaseAdmin
    .from("generation_history")
    .insert(historyPayload)
    .select("id")
    .single();

  if (historyError) {
    console.error("[retouching] history insert failed:", historyError);
  }

  // 11. Lambda 이미지 최적화 (fire-and-forget)
  const skipOptimizer = process.env.SKIP_IMAGE_OPTIMIZER === "true";
  if (historyRow && !skipOptimizer) {
    lambda.send(new InvokeCommand({
      FunctionName: "ai-image-optimizer",
      InvocationType: "Event",
      Payload: JSON.stringify({
        historyId: historyRow.id,
        userId: user.id,
        outputUrls: allOutputUrls,
      }),
    })).catch((err) => {
      console.error("[lambda] invoke failed:", err);
    });
  }

  // 12. 응답
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      outputUrls: allOutputUrls,
      inputImageUrl: null,
      creditsUsed: CREDIT_COST,
      balanceAfter: deductResult.totalBalance ?? 0,
      historyId: historyRow?.id ?? null,
    },
  };

  return NextResponse.json(body);
});

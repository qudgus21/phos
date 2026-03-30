import { NextResponse, after } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { getRetouchingModelDef } from "@/lib/services/ai/models";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildSkinRetouchPrompt } from "@/lib/services/ai/prompts";
import type { SkinRetouchOptions } from "@/lib/services/ai/prompts";
import {
  getUserCreditInfo,
  deductCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { uploadFileToReplicate } from "@/lib/services/ai/replicate-files";
import { upscaleImages } from "@/lib/services/ai/upscaler";
import { createAdminClient } from "@/lib/supabase/admin";
import { runGenerationInBackground } from "@/lib/services/generation/background";
import { CreditError, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

const CREDIT_COST = 110;
const DEFAULT_MODEL_ID = "retouching-gpt-image-1.5";

interface GenerateResponse {
  historyId: string;
  creditsUsed: number;
  balanceAfter: number;
  status: "pending";
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
  const filterIntensityRaw = Number(formData.get("filterIntensity") ?? 0.5);
  const filterIntensity = isNaN(filterIntensityRaw) ? 0.5 : filterIntensityRaw;
  const gender = formData.get("gender") as string;
  const mode = formData.get("mode") as string;
  const excludedAreasRaw = formData.get("excludedAreas") as string;
  const faceReshape = formData.get("faceReshape") === "true";
  const faceReshapeIntensityRaw = Number(formData.get("faceReshapeIntensity") ?? 0.5);
  const faceReshapeIntensity = isNaN(faceReshapeIntensityRaw) ? 0.5 : faceReshapeIntensityRaw;
  const outputSize = formData.get("outputSize") as string;
  const ratio = formData.get("ratio") as string;
  const scale = Number(formData.get("scale") || 1);

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
  const VALID_RATIOS = ["1:1", "3:2", "2:3"] as const;
  if (!VALID_RATIOS.includes(ratio as typeof VALID_RATIOS[number])) {
    throw new ValidationError("올바르지 않은 비율입니다");
  }

  const rawAreas = excludedAreasRaw ? excludedAreasRaw.split(",") : [];
  const excludedAreas = rawAreas.filter((a) => VALID_AREAS.includes(a as typeof VALID_AREAS[number]));
  if (rawAreas.length !== excludedAreas.length) {
    console.warn("[retouching] invalid excludedAreas ignored:", rawAreas.filter(a => !excludedAreas.includes(a)));
  }

  // 3. 모델 설정
  const modelDef = getRetouchingModelDef(DEFAULT_MODEL_ID);
  if (!modelDef) {
    throw new ValidationError("지원하지 않는 모델입니다");
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
  if (process.env.NODE_ENV === "development") {
    console.log("[retouching] prompt:", builtPrompt);
  }

  // 5. 크레딧 + 플랜 정보 조회
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

  // 6. 이미지 업로드 (after() 전에 완료)
  const imageUrl = await uploadFileToReplicate(imageFile, imageFile.name);

  // 7. dry-run 모드
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

  // 9. pending 상태로 히스토리 INSERT
  const supabaseAdmin = createAdminClient();
  const { data: historyRow, error: historyError } = await supabaseAdmin
    .from("generation_history")
    .insert({
      user_id: user.id,
      feature_type: "retouching" as const,
      model_id: DEFAULT_MODEL_ID,
      prompt: builtPrompt,
      input_urls: [imageUrl],
      display_urls: [],
      original_urls: [],
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
      status: "pending",
      onetime_deducted: deductResult.onetimeDeducted ?? 0,
      subscription_deducted: deductResult.subscriptionDeducted ?? 0,
    })
    .select("id")
    .single();

  if (historyError) {
    console.error("[retouching] history insert failed:", historyError);
    throw new Error("히스토리 저장에 실패했습니다");
  }

  // 10. 즉시 응답 반환
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      historyId: historyRow.id,
      creditsUsed: CREDIT_COST,
      balanceAfter: deductResult.totalBalance ?? 0,
      status: "pending",
    },
  };

  // 11. 백그라운드에서 AI 생성
  after(() =>
    runGenerationInBackground({
      historyId: historyRow.id,
      userId: user.id,
      modelLabel: modelDef.label,
      imageCount: 1,
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

        let allOutputUrls = result.outputUrls;

        const effectiveScale = Math.min(
          scale > 1 ? Math.round(scale) : 1,
          4
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

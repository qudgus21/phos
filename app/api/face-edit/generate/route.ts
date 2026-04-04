import { NextResponse, after } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { resolveProvider } from "@/lib/services/ai/registry";
import { buildFaceEditPrompt } from "@/lib/services/ai/prompts";
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

const CREDIT_COST = 40;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const REPLICATE_MODEL = "black-forest-labs/flux-fill-pro";

interface GenerateResponse {
  historyId: string;
  creditsUsed: number;
  balanceAfter: number;
  status: "pending";
}

export const POST = withAuth(async (request, { user }) => {
  // 1. FormData 파싱
  const formData = await request.formData();

  const gender = formData.get("gender") as string;
  const strength = Number(formData.get("strength"));
  const scale = formData.get("scale") as string; // "auto" | "1" | "2" | "3" | "4"
  const imageEntry = formData.get("image");
  const maskEntry = formData.get("mask");
  const inputImageUrl = formData.get("inputImageUrl") as string | null;

  // 2. 검증
  if (!gender || !["female", "male"].includes(gender)) {
    throw new ValidationError("Please select a gender");
  }
  if (isNaN(strength) || strength < 0.1 || strength > 1) {
    throw new ValidationError("Invalid strength value");
  }
  if (!imageEntry) {
    throw new ValidationError("Please upload an image");
  }
  if (!maskEntry) {
    throw new ValidationError("Please select an area to edit");
  }

  if (imageEntry instanceof File && imageEntry.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size must be ${MAX_FILE_SIZE / 1024 / 1024} MB or less`);
  }
  if (maskEntry instanceof File && maskEntry.size > MAX_FILE_SIZE) {
    throw new ValidationError("Mask file is too large");
  }

  // 3. 크레딧 + 플랜 정보 조회
  const creditInfo = await getUserCreditInfo(user.id);

  const cooldownRemaining = checkCooldown(
    creditInfo.lastGenerationAt,
    creditInfo.plan.cooldownSeconds
  );
  if (cooldownRemaining > 0) {
    throw new ValidationError(
      `Please wait ${Math.ceil(cooldownRemaining / 60)} minutes before trying again`
    );
  }

  // 4. 이미지 & 마스크 업로드 (after() 전에 완료)
  const imageUrl = imageEntry instanceof File
    ? await uploadFileToReplicate(imageEntry, imageEntry.name)
    : imageEntry as string;

  const maskUrl = maskEntry instanceof File
    ? await uploadFileToReplicate(maskEntry, "mask.png")
    : maskEntry as string;

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
    CREDIT_COST,
    "Face edit generation",
    { gender, strength, scale }
  );

  if (!deductResult.success) {
    throw new CreditError(
      "Insufficient credits",
      deductResult.required ?? CREDIT_COST,
      deductResult.available ?? 0
    );
  }

  // 7. pending 상태로 히스토리 INSERT
  const supabaseAdmin = createAdminClient();
  const { data: historyRow, error: historyError } = await supabaseAdmin
    .from("generation_history")
    .insert({
      user_id: user.id,
      feature_type: "face-edit" as const,
      model_id: "flux-fill-pro",
      prompt: `[${gender}] face-edit`,
      input_urls: inputImageUrl ? [inputImageUrl] : [imageUrl],
      display_urls: [],
      original_urls: [],
      credits_used: CREDIT_COST,
      metadata: { gender, strength, scale },
      status: "pending",
      onetime_deducted: deductResult.onetimeDeducted ?? 0,
      subscription_deducted: deductResult.subscriptionDeducted ?? 0,
    })
    .select("id")
    .single();

  if (historyError) {
    console.error("[face-edit] history insert failed:", historyError);
    throw new Error("Failed to save history");
  }

  // 8. 즉시 응답 반환
  const body: ApiResponse<GenerateResponse> = {
    success: true,
    data: {
      historyId: historyRow.id,
      creditsUsed: CREDIT_COST,
      balanceAfter: deductResult.totalBalance ?? 0,
      status: "pending",
    },
  };

  // 9. 백그라운드에서 AI 생성
  after(() =>
    runGenerationInBackground({
      historyId: historyRow.id,
      userId: user.id,
      modelLabel: "Flux Fill Pro",
      imageCount: 1,
      onetimeDeducted: deductResult.onetimeDeducted ?? 0,
      subscriptionDeducted: deductResult.subscriptionDeducted ?? 0,
      generateFn: async () => {
        const prompt = buildFaceEditPrompt(gender as "female" | "male");

        const steps = Math.round(20 + ((strength - 0.1) / 0.9) * 8);
        const guidance = Math.round(15 + ((strength - 0.1) / 0.9) * 10);

        const provider = resolveProvider({
          provider: "replicate",
          modelId: REPLICATE_MODEL,
        });

        const modelConfig = {
          provider: "replicate" as const,
          modelId: REPLICATE_MODEL,
        };

        const result = await provider.generate(modelConfig, {
          prompt,
          params: {
            prompt,
            image: imageUrl,
            mask: maskUrl,
            steps,
            guidance,
            output_format: "png",
            safety_tolerance: 3,
          },
        });

        let outputUrls = result.outputUrls;

        if (scale !== "auto") {
          const scaleNum = Number(scale);
          if (scaleNum >= 2) {
            outputUrls = await upscaleImages(outputUrls, scaleNum);
          }
        }

        return outputUrls;
      },
    })
  );

  return NextResponse.json(body);
});

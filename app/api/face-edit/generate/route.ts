import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { ReplicateProvider } from "@/lib/services/ai/providers/replicate";
import { buildFaceEditPrompt } from "@/lib/services/ai/prompts";
import {
  getUserCreditInfo,
  deductCredits,
  checkCooldown,
} from "@/lib/services/credits";
import { uploadFileToReplicate } from "@/lib/services/ai/replicate-files";
import { uploadToR2 } from "@/lib/r2/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReplicateWebhookUrl } from "@/lib/services/replicate/webhook-url";
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

  // 4. 이미지 & 마스크 업로드
  const imageUrl = imageEntry instanceof File
    ? await uploadFileToReplicate(imageEntry, imageEntry.name)
    : imageEntry as string;

  const maskUrl = maskEntry instanceof File
    ? await uploadFileToReplicate(maskEntry, "mask.png")
    : maskEntry as string;

  // 입력 이미지를 R2에 영구 저장 (히스토리 표시용)
  let permanentInputUrl: string | null = inputImageUrl;
  if (!permanentInputUrl && imageEntry instanceof File) {
    const buffer = Buffer.from(await imageEntry.arrayBuffer());
    const key = `generation-outputs/inputs/${user.id}/${Date.now()}.webp`;
    permanentInputUrl = await uploadToR2(buffer, key, "image/webp");
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
      input_urls: permanentInputUrl ? [permanentInputUrl] : [imageUrl],
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

  // 8. Replicate prediction 생성 (fire-and-forget, webhook으로 결과 수신)
  const prompt = buildFaceEditPrompt(gender as "female" | "male");
  const steps = Math.round(20 + ((strength - 0.1) / 0.9) * 8);
  const guidance = Math.round(15 + ((strength - 0.1) / 0.9) * 10);

  const provider = new ReplicateProvider();
  const webhookUrl = getReplicateWebhookUrl();
  const modelConfig = {
    provider: "replicate" as const,
    modelId: REPLICATE_MODEL,
  };

  const { predictionId } = await provider.createPrediction(
    modelConfig,
    {
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
    },
    webhookUrl
  );

  // 9. prediction 추적 행 INSERT
  const scaleNum = scale !== "auto" ? Number(scale) : 0;
  await supabaseAdmin.from("replicate_predictions").insert({
    id: predictionId,
    history_id: historyRow.id,
    prediction_type: "generation",
    status: "pending",
    metadata: {
      upscale_scale: scaleNum >= 2 ? scaleNum : 0,
      batch_index: 0,
      total_batches: 1,
    },
  });

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

  return NextResponse.json(body);
});

import { createAdminClient } from "@/lib/supabase/admin";
import { refundCredits } from "@/lib/services/credits";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda: LambdaClient =
  (globalThis as Record<string, unknown>).__lambdaClient as LambdaClient ??
  ((globalThis as Record<string, unknown>).__lambdaClient = new LambdaClient({ region: "us-east-2" }));

/**
 * 생성 성공: generation_history를 completed로 업데이트하고 Lambda 최적화를 호출한다.
 */
export async function handleGenerationCompleted(
  historyId: string,
  outputUrls: string[]
): Promise<void> {
  const supabaseAdmin = createAdminClient();

  await supabaseAdmin
    .from("generation_history")
    .update({
      status: "completed",
      display_urls: outputUrls,
      original_urls: outputUrls,
    })
    .eq("id", historyId);

  // Lambda 이미지 최적화 (fire-and-forget)
  const skipOptimizer = process.env.SKIP_IMAGE_OPTIMIZER === "true";
  if (!skipOptimizer) {
    const { data: row } = await supabaseAdmin
      .from("generation_history")
      .select("user_id")
      .eq("id", historyId)
      .single();

    if (row) {
      lambda.send(new InvokeCommand({
        FunctionName: "ai-image-optimizer",
        InvocationType: "Event",
        Payload: JSON.stringify({
          historyId,
          userId: row.user_id,
          outputUrls,
        }),
      })).catch((err) => {
        console.error("[lambda] invoke failed:", err);
      });
    }
  }
}

/**
 * 생성 실패: generation_history를 failed로 업데이트하고 크레딧을 환불한다.
 */
export async function handleGenerationFailed(
  historyId: string,
  errorMessage: string
): Promise<void> {
  const supabaseAdmin = createAdminClient();

  // history에서 환불 정보 조회
  const { data: row } = await supabaseAdmin
    .from("generation_history")
    .select("user_id, onetime_deducted, subscription_deducted, model_id, credits_used")
    .eq("id", historyId)
    .single();

  if (!row) {
    console.error("[completion] history row not found:", historyId);
    return;
  }

  // status → failed
  await supabaseAdmin
    .from("generation_history")
    .update({
      status: "failed",
      error_message: errorMessage,
    })
    .eq("id", historyId);

  // 크레딧 환불
  await refundCredits(
    row.user_id,
    row.onetime_deducted,
    row.subscription_deducted,
    `Generation failed refund (${row.model_id})`,
    { historyId, reason: errorMessage }
  );
}

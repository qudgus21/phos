import { createAdminClient } from "@/lib/supabase/admin";
import { refundCredits } from "@/lib/services/credits";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda: LambdaClient =
  (globalThis as Record<string, unknown>).__lambdaClient as LambdaClient ??
  ((globalThis as Record<string, unknown>).__lambdaClient = new LambdaClient({ region: "us-east-2" }));

interface BackgroundGenerationParams {
  historyId: string;
  userId: string;
  modelLabel: string;
  imageCount: number;
  onetimeDeducted: number;
  subscriptionDeducted: number;
  generateFn: () => Promise<string[]>;
}

/**
 * API 응답 반환 후 백그라운드에서 AI 생성을 실행한다.
 * 성공 시 generation_history를 completed로 업데이트하고 Lambda 최적화를 호출한다.
 * 실패 시 failed로 업데이트하고 크레딧을 환불한다.
 */
export async function runGenerationInBackground(params: BackgroundGenerationParams): Promise<void> {
  const {
    historyId,
    userId,
    modelLabel,
    imageCount,
    onetimeDeducted,
    subscriptionDeducted,
    generateFn,
  } = params;

  const supabaseAdmin = createAdminClient();

  try {
    const outputUrls = await generateFn();

    // 성공: status → completed, URL 설정
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
      lambda.send(new InvokeCommand({
        FunctionName: "ai-image-optimizer",
        InvocationType: "Event",
        Payload: JSON.stringify({
          historyId,
          userId,
          outputUrls,
        }),
      })).catch((err) => {
        console.error("[lambda] invoke failed:", err);
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[background] generation failed:", err);

    // 실패: status → failed
    await supabaseAdmin
      .from("generation_history")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", historyId);

    // 크레딧 환불
    await refundCredits(
      userId,
      onetimeDeducted,
      subscriptionDeducted,
      `생성 실패 환불 (${modelLabel}, ${imageCount}장)`,
      { historyId, reason: errorMessage }
    );
  }
}

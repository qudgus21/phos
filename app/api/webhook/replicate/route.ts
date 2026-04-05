import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/services/replicate/webhook-verify";
import { getReplicateWebhookUrl } from "@/lib/services/replicate/webhook-url";
import { createUpscalePrediction } from "@/lib/services/ai/upscaler";
import {
  handleGenerationCompleted,
  handleGenerationFailed,
} from "@/lib/services/generation/completion";

interface ReplicateWebhookPayload {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
}

function extractUrls(output: unknown): string[] {
  if (!output) return [];
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) {
    return output.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export async function POST(request: NextRequest) {
  // 1. raw body (서명 검증에 필요)
  const rawBody = await request.text();

  // 2. 서명 검증
  const verifyResult = verifyWebhookSignature(rawBody, {
    "webhook-id": request.headers.get("webhook-id"),
    "webhook-timestamp": request.headers.get("webhook-timestamp"),
    "webhook-signature": request.headers.get("webhook-signature"),
  });

  if (!verifyResult.valid) {
    console.warn("[webhook/replicate] Signature verification failed:", verifyResult.reason);
    return new Response("Forbidden", { status: 403 });
  }

  // 3. payload 파싱
  let payload: ReplicateWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { id: predictionId, status, output, error } = payload;

  if (!predictionId) {
    return new Response("Missing prediction ID", { status: 400 });
  }

  // completed 이벤트만 구독하므로 terminal 상태만 처리
  if (status !== "succeeded" && status !== "failed" && status !== "canceled") {
    return new Response("OK", { status: 200 });
  }

  const supabaseAdmin = createAdminClient();

  // 4. prediction 조회
  const { data: prediction } = await supabaseAdmin
    .from("replicate_predictions")
    .select("*")
    .eq("id", predictionId)
    .single();

  if (!prediction) {
    // 알 수 없는 prediction — 무시 (다른 시스템에서 생성된 것일 수 있음)
    console.warn("[webhook/replicate] Unknown prediction:", predictionId);
    return new Response("OK", { status: 200 });
  }

  // 5. 이미 처리됨 (idempotent)
  if (prediction.status === "succeeded" || prediction.status === "failed") {
    return new Response("OK", { status: 200 });
  }

  const historyId = prediction.history_id;
  const predictionType = prediction.prediction_type as "generation" | "upscale";
  const metadata = (prediction.metadata ?? {}) as Record<string, unknown>;

  // ── 실패/취소 처리 ──────────────────────────────────────
  if (status === "failed" || status === "canceled") {
    const errorMsg = error || (status === "canceled" ? "Prediction canceled" : "Prediction failed");

    await supabaseAdmin
      .from("replicate_predictions")
      .update({
        status: "failed",
        error_message: errorMsg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", predictionId);

    if (predictionType === "generation") {
      // generation 실패 → 전체 실패 + 크레딧 환불
      // 같은 history의 다른 pending generation도 의미 없으므로 전체 실패 처리
      await supabaseAdmin
        .from("replicate_predictions")
        .update({
          status: "failed",
          error_message: "Sibling prediction failed",
          completed_at: new Date().toISOString(),
        })
        .eq("history_id", historyId)
        .eq("status", "pending");

      await handleGenerationFailed(historyId, errorMsg);
    } else {
      // upscale 실패 ��� 원본 generation URL로 fallback
      await handleUpscaleFallback(supabaseAdmin, historyId);
    }

    return new Response("OK", { status: 200 });
  }

  // ── 성공 처리 ──────────────────────────────────────────
  const outputUrls = extractUrls(output);

  await supabaseAdmin
    .from("replicate_predictions")
    .update({
      status: "succeeded",
      output_urls: outputUrls,
      completed_at: new Date().toISOString(),
    })
    .eq("id", predictionId);

  if (predictionType === "generation") {
    await handleGenerationSucceeded(supabaseAdmin, historyId, metadata);
  } else {
    await handleUpscaleSucceeded(supabaseAdmin, historyId);
  }

  return new Response("OK", { status: 200 });
}

// ── Generation 성공 핸들러 ──────────────────────────────
async function handleGenerationSucceeded(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  historyId: string,
  metadata: Record<string, unknown>
) {
  // 같은 history의 모든 generation prediction 확인
  const { data: allPredictions } = await supabaseAdmin
    .from("replicate_predictions")
    .select("*")
    .eq("history_id", historyId)
    .eq("prediction_type", "generation")
    .order("created_at", { ascending: true });

  if (!allPredictions) return;

  // 아직 pending이 있으면 대기
  const hasPending = allPredictions.some((p) => p.status === "pending");
  if (hasPending) return;

  // 하나라도 failed면 전체 실패 (이미 실패 핸들러에서 처리했을 수 있지만 안전장치)
  const hasFailed = allPredictions.some((p) => p.status === "failed");
  if (hasFailed) return;

  // 모든 generation 성공 → output URL 수집 (batch_index 순)
  const sorted = [...allPredictions].sort((a, b) => {
    const ai = ((a.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    const bi = ((b.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    return ai - bi;
  });
  const allOutputUrls = sorted.flatMap((p) => p.output_urls ?? []);

  // 업스케일 필요 여부 확인
  const upscaleScale = (metadata.upscale_scale as number) ?? 0;
  if (upscaleScale >= 2) {
    // 업스케일 prediction 생성
    const webhookUrl = getReplicateWebhookUrl();

    for (let i = 0; i < allOutputUrls.length; i++) {
      try {
        const upscalePredictionId = await createUpscalePrediction(
          allOutputUrls[i],
          upscaleScale,
          webhookUrl
        );

        await supabaseAdmin.from("replicate_predictions").insert({
          id: upscalePredictionId,
          history_id: historyId,
          prediction_type: "upscale",
          status: "pending",
          metadata: {
            upscale_scale: upscaleScale,
            batch_index: i,
            source_url: allOutputUrls[i],
          },
        });
      } catch (err) {
        console.error("[webhook/replicate] Failed to create upscale prediction:", err);
        // 업스케일 생성 자체가 실패하면 원본으로 완료 처리
        await handleGenerationCompleted(historyId, allOutputUrls);
        return;
      }
    }
  } else {
    // 업스케일 불필요 → 바로 완료
    await handleGenerationCompleted(historyId, allOutputUrls);
  }
}

// ── Upscale 성공 핸들러 ──────────────────────────────────
async function handleUpscaleSucceeded(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  historyId: string
) {
  const { data: allUpscales } = await supabaseAdmin
    .from("replicate_predictions")
    .select("*")
    .eq("history_id", historyId)
    .eq("prediction_type", "upscale")
    .order("created_at", { ascending: true });

  if (!allUpscales) return;

  // 아직 pending이 있으면 대기
  const hasPending = allUpscales.some((p) => p.status === "pending");
  if (hasPending) return;

  // 하나라도 failed → fallback
  const hasFailed = allUpscales.some((p) => p.status === "failed");
  if (hasFailed) {
    await handleUpscaleFallback(supabaseAdmin, historyId);
    return;
  }

  // 모든 업스케일 성공 → batch_index 순서로 URL 수집
  const sorted = [...allUpscales].sort((a, b) => {
    const ai = ((a.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    const bi = ((b.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    return ai - bi;
  });
  const upscaledUrls = sorted.flatMap((p) => p.output_urls ?? []);

  await handleGenerationCompleted(historyId, upscaledUrls);
}

// ── Upscale 실패 시 fallback: 원본 generation URL로 완료 처리 ──
async function handleUpscaleFallback(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  historyId: string
) {
  // generation prediction의 output URL을 가져와서 완료 처리
  const { data: genPredictions } = await supabaseAdmin
    .from("replicate_predictions")
    .select("output_urls, metadata")
    .eq("history_id", historyId)
    .eq("prediction_type", "generation")
    .eq("status", "succeeded")
    .order("created_at", { ascending: true });

  if (!genPredictions || genPredictions.length === 0) {
    // generation 결과도 없으면 실패 처리
    await handleGenerationFailed(historyId, "Upscale failed and no generation output available");
    return;
  }

  const sorted = [...genPredictions].sort((a, b) => {
    const ai = ((a.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    const bi = ((b.metadata as Record<string, unknown>)?.batch_index as number) ?? 0;
    return ai - bi;
  });
  const originalUrls = sorted.flatMap((p) => p.output_urls ?? []);

  console.warn("[webhook/replicate] Upscale failed, falling back to original URLs for history:", historyId);
  await handleGenerationCompleted(historyId, originalUrls);
}

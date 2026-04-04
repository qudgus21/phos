import { ApiError } from "@/lib/errors";

const REPLICATE_BASE_URL = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | null;
  error?: string | null;
  urls?: { get: string };
}

/**
 * 429 자동 재시도 fetch
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, init);

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = Number(res.headers.get("retry-after")) || 10;
      const waitMs = Math.min(retryAfter, 30) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`[upscaler] API error (${res.status}):`, text);
      throw new ApiError("Image upscaling error", 502);
    }

    return res;
  }

  throw new ApiError("Upscaler API retry limit exceeded (429)", 502);
}

/**
 * Replicate Real-ESRGAN 기반 이미지 업스케일
 * @param imageUrl 원본 이미지 URL
 * @param scaleFactor 업스케일 배율 (2 or 4)
 * @returns 업스케일된 이미지 URL
 */
export async function upscaleImage(
  imageUrl: string,
  scaleFactor: number = 2
): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new ApiError("REPLICATE_API_TOKEN environment variable is not set", 500);
  }

  const scale = Math.min(Math.max(Math.round(scaleFactor), 2), 4);

  const res = await fetchWithRetry(
    `${REPLICATE_BASE_URL}/models/nightmareai/real-esrgan/predictions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          scale: scale,
          face_enhance: false,
        },
      }),
    }
  );

  let prediction = (await res.json()) as ReplicatePrediction;

  if (prediction.status !== "succeeded" && prediction.status !== "failed") {
    prediction = await poll(prediction, apiToken);
  }

  if (prediction.status === "failed") {
    console.error("[upscaler] prediction failed:", prediction.error);
    throw new ApiError("Image upscaling failed", 502);
  }

  if (!prediction.output || typeof prediction.output !== "string") {
    throw new ApiError("No result URL returned from Upscaler", 502);
  }

  return prediction.output;
}

/**
 * 여러 이미지를 stagger 방식으로 업스케일 (요청 간 1초 간격)
 */
export async function upscaleImages(
  imageUrls: string[],
  scaleFactor: number = 2
): Promise<string[]> {
  const results: Promise<string>[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    results.push(upscaleImage(imageUrls[i], scaleFactor));
  }
  return Promise.all(results);
}

async function poll(
  prediction: ReplicatePrediction,
  apiToken: string,
  maxAttempts = 60
): Promise<ReplicatePrediction> {
  const pollUrl = prediction.urls?.get;
  if (!pollUrl) {
    throw new ApiError("Upscaler polling URL is missing", 502);
  }

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) {
      throw new ApiError(`Upscaler polling error (${res.status})`, 502);
    }
    const updated = (await res.json()) as ReplicatePrediction;
    if (updated.status === "succeeded" || updated.status === "failed") {
      return updated;
    }
  }

  throw new ApiError("Upscale timed out", 504);
}

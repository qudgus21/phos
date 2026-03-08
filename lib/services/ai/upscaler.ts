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
    throw new ApiError("REPLICATE_API_TOKEN 환경변수가 설정되지 않았습니다", 500);
  }

  const scale = Math.min(Math.max(Math.round(scaleFactor), 2), 4);

  const res = await fetch(
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

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(`Upscaler API 오류 (${res.status}): ${text}`, 502);
  }

  let prediction = (await res.json()) as ReplicatePrediction;

  if (prediction.status !== "succeeded" && prediction.status !== "failed") {
    prediction = await poll(prediction, apiToken);
  }

  if (prediction.status === "failed") {
    throw new ApiError(
      `Upscale 실패: ${prediction.error ?? "Unknown error"}`,
      502
    );
  }

  if (!prediction.output || typeof prediction.output !== "string") {
    throw new ApiError("Upscaler에서 결과 URL을 받지 못했습니다", 502);
  }

  return prediction.output;
}

/**
 * 여러 이미지를 병렬로 업스케일
 */
export async function upscaleImages(
  imageUrls: string[],
  scaleFactor: number = 2
): Promise<string[]> {
  return Promise.all(imageUrls.map((url) => upscaleImage(url, scaleFactor)));
}

async function poll(
  prediction: ReplicatePrediction,
  apiToken: string,
  maxAttempts = 60
): Promise<ReplicatePrediction> {
  const pollUrl = prediction.urls?.get;
  if (!pollUrl) {
    throw new ApiError("Upscaler polling URL이 없습니다", 502);
  }

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) {
      throw new ApiError(`Upscaler polling 오류 (${res.status})`, 502);
    }
    const updated = (await res.json()) as ReplicatePrediction;
    if (updated.status === "succeeded" || updated.status === "failed") {
      return updated;
    }
  }

  throw new ApiError("Upscale 시간 초과", 504);
}

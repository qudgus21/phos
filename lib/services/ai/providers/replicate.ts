import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get: string };
}

export class ReplicateProvider implements AIProvider {
  readonly name: AIProviderName = "replicate";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new ApiError(
        "REPLICATE_API_TOKEN 환경변수가 설정되지 않았습니다",
        500
      );
    }

    const modelInput: Record<string, unknown> = {
      prompt: input.prompt ?? "",
      ...input.params,
    };

    if (input.images && input.images.length > 0) {
      modelInput.image = input.images[0];
      if (input.images.length > 1) {
        modelInput.images = input.images;
      }
    }

    if (input.negativePrompt) {
      modelInput.negative_prompt = input.negativePrompt;
    }

    const body: Record<string, unknown> = {
      model: model.modelId,
      input: modelInput,
    };

    if (model.version) {
      body.version = model.version;
      delete body.model;
    }

    const start = Date.now();

    // Prefer: wait 헤더로 최대 60초 동기 대기
    const res = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        Prefer: "wait=60",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(
        `Replicate API 오류 (${res.status}): ${text}`,
        502
      );
    }

    let prediction = (await res.json()) as ReplicatePrediction;

    // 아직 완료되지 않은 경우 polling
    if (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      prediction = await this.poll(prediction, apiToken);
    }

    if (prediction.status === "failed") {
      throw new ApiError(
        `Replicate 생성 실패: ${prediction.error ?? "Unknown error"}`,
        502
      );
    }

    const outputUrls = this.extractUrls(prediction.output);
    if (outputUrls.length === 0) {
      throw new ApiError("Replicate에서 결과 URL을 받지 못했습니다", 502);
    }

    return {
      outputUrls,
      provider: this.name,
      modelId: model.modelId,
      durationMs: Date.now() - start,
    };
  }

  private async poll(
    prediction: ReplicatePrediction,
    apiToken: string,
    maxAttempts = 60
  ): Promise<ReplicatePrediction> {
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) {
      throw new ApiError("Replicate polling URL이 없습니다", 502);
    }

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      if (!res.ok) {
        throw new ApiError(`Replicate polling 오류 (${res.status})`, 502);
      }

      const updated = (await res.json()) as ReplicatePrediction;
      if (
        updated.status === "succeeded" ||
        updated.status === "failed"
      ) {
        return updated;
      }
    }

    throw new ApiError("Replicate 생성 시간 초과", 504);
  }

  private extractUrls(
    output: string | string[] | null | undefined
  ): string[] {
    if (!output) return [];
    if (typeof output === "string") return [output];
    if (Array.isArray(output)) {
      return output.filter((item): item is string => typeof item === "string");
    }
    return [];
  }
}

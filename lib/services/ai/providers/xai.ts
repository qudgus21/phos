import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

const XAI_API_URL = "https://api.x.ai/v1/images/generations";

interface XAIResponse {
  data: Array<{ url: string }>;
}

export class XAIProvider implements AIProvider {
  readonly name: AIProviderName = "xai";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new ApiError("XAI_API_KEY 환경변수가 설정되지 않았습니다", 500);
    }

    const { n } = (input.params ?? {}) as { n?: number };

    const body: Record<string, unknown> = {
      model: model.modelId,
      prompt: input.prompt ?? "",
    };

    if (n && n > 1) {
      body.n = n;
    }

    const start = Date.now();

    const res = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(
        `xAI API 오류 (${res.status}): ${text}`,
        502
      );
    }

    const json = (await res.json()) as XAIResponse;
    const outputUrls = json.data.map((d) => d.url);

    return {
      outputUrls,
      provider: this.name,
      modelId: model.modelId,
      durationMs: Date.now() - start,
    };
  }
}

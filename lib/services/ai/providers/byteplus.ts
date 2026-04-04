import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

const ARK_API_URL =
  "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";

interface ArkResponse {
  data: Array<{ url: string }>;
}

export class BytePlusProvider implements AIProvider {
  readonly name: AIProviderName = "byteplus";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new ApiError("ARK_API_KEY environment variable is not set", 500);
    }

    const { width, height, n } = (input.params ?? {}) as {
      width?: number;
      height?: number;
      n?: number;
    };

    const body: Record<string, unknown> = {
      model: model.modelId,
      prompt: input.prompt ?? "",
      response_format: "url",
    };

    if (input.images && input.images.length > 0) {
      body.image_urls = input.images;
    }

    if (width && height) {
      body.size = `${width}x${height}`;
    }

    if (n && n > 1) {
      body.n = n;
    }

    const start = Date.now();

    const res = await fetch(ARK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[byteplus] API error (${res.status}):`, text);
      throw new ApiError("AI image generation failed", 502);
    }

    const json = (await res.json()) as ArkResponse;
    const outputUrls = json.data.map((d) => d.url);

    return {
      outputUrls,
      provider: this.name,
      modelId: model.modelId,
      durationMs: Date.now() - start,
    };
  }
}

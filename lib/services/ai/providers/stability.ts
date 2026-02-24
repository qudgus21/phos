import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

export class StabilityProvider implements AIProvider {
  readonly name: AIProviderName = "stability";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    // TODO: Stability AI API 연동
    // const response = await fetch("https://api.stability.ai/v2beta/...", { ... })

    void model;
    void input;

    throw new ApiError("StabilityProvider.generate() not implemented", 501);
  }

  async getStatus(
    predictionId: string
  ): Promise<"pending" | "processing" | "succeeded" | "failed"> {
    // TODO: Stability AI 상태 조회
    void predictionId;
    throw new ApiError("StabilityProvider.getStatus() not implemented", 501);
  }
}

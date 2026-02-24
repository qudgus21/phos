import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";
import { ApiError } from "@/lib/errors";

export class ReplicateProvider implements AIProvider {
  readonly name: AIProviderName = "replicate";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    // TODO: Replicate API 연동
    // const response = await fetch("https://api.replicate.com/v1/predictions", { ... })

    void model;
    void input;

    throw new ApiError("ReplicateProvider.generate() not implemented", 501);
  }

  async getStatus(
    predictionId: string
  ): Promise<"pending" | "processing" | "succeeded" | "failed"> {
    // TODO: Replicate API 상태 조회
    void predictionId;
    throw new ApiError("ReplicateProvider.getStatus() not implemented", 501);
  }
}

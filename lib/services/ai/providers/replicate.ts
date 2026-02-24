import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";

export class ReplicateProvider implements AIProvider {
  name: AIProviderName = "replicate";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const start = Date.now();

    // TODO: Replicate API 연동
    // const response = await fetch("https://api.replicate.com/v1/predictions", { ... })

    void model;
    void input;

    throw new Error("ReplicateProvider.generate() not implemented");

    return {
      outputUrl: "",
      provider: this.name,
      modelId: model.modelId,
      durationMs: Date.now() - start,
    };
  }

  async getStatus(
    predictionId: string
  ): Promise<"pending" | "processing" | "succeeded" | "failed"> {
    // TODO: Replicate API 상태 조회
    void predictionId;
    throw new Error("ReplicateProvider.getStatus() not implemented");
  }
}

import type {
  AIProvider,
  AIProviderName,
  ModelConfig,
  GenerationInput,
  GenerationResult,
} from "../types";

export class StabilityProvider implements AIProvider {
  name: AIProviderName = "stability";

  async generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult> {
    const start = Date.now();

    // TODO: Stability AI API 연동
    // const response = await fetch("https://api.stability.ai/v2beta/...", { ... })

    void model;
    void input;

    throw new Error("StabilityProvider.generate() not implemented");

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
    // TODO: Stability AI 상태 조회
    void predictionId;
    throw new Error("StabilityProvider.getStatus() not implemented");
  }
}

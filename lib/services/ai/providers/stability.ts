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
    void model;
    void input;
    throw new ApiError("StabilityProvider.generate() not implemented", 501);
  }
}

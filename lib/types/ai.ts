export type AIProviderName = "replicate" | "stability";

export interface ModelConfig {
  provider: AIProviderName;
  modelId: string;
  version?: string;
  defaults?: Record<string, unknown>;
}

export interface GenerationInput {
  image?: string; // base64 또는 URL
  prompt?: string;
  negativePrompt?: string;
  params?: Record<string, unknown>;
}

export interface GenerationResult {
  outputUrl: string;
  provider: AIProviderName;
  modelId: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly name: AIProviderName;
  generate(
    model: ModelConfig,
    input: GenerationInput
  ): Promise<GenerationResult>;
  getStatus(predictionId: string): Promise<"pending" | "processing" | "succeeded" | "failed">;
}

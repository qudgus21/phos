export type AIProviderName = "replicate" | "stability" | "byteplus" | "xai";

export interface ModelConfig {
  provider: AIProviderName;
  modelId: string;
  version?: string;
  defaults?: Record<string, unknown>;
}

export interface GenerationInput {
  images?: string[];
  prompt?: string;
  negativePrompt?: string;
  params?: Record<string, unknown>;
}

export interface GenerationResult {
  outputUrls: string[];
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
}

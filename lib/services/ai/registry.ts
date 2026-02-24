import type { AIProvider, AIProviderName, ModelConfig } from "./types";
import { ReplicateProvider } from "./providers/replicate";
import { StabilityProvider } from "./providers/stability";

const providers: Record<AIProviderName, AIProvider> = {
  replicate: new ReplicateProvider(),
  stability: new StabilityProvider(),
};

export function getProvider(name: AIProviderName): AIProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return provider;
}

export function resolveProvider(model: ModelConfig): AIProvider {
  return getProvider(model.provider);
}

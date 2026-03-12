import type { AIProvider, AIProviderName, ModelConfig } from "./types";
import { ReplicateProvider } from "./providers/replicate";
import { StabilityProvider } from "./providers/stability";
import { BytePlusProvider } from "./providers/byteplus";
const providerFactories: Record<AIProviderName, () => AIProvider> = {
  replicate: () => new ReplicateProvider(),
  stability: () => new StabilityProvider(),
  byteplus: () => new BytePlusProvider(),
};

const providerCache = new Map<AIProviderName, AIProvider>();

export function getProvider(name: AIProviderName): AIProvider {
  let provider = providerCache.get(name);
  if (!provider) {
    const factory = providerFactories[name];
    if (!factory) throw new Error(`Unknown AI provider: ${name}`);
    provider = factory();
    providerCache.set(name, provider);
  }
  return provider;
}

export function resolveProvider(model: ModelConfig): AIProvider {
  return getProvider(model.provider);
}

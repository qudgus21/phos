import type { AIProvider, AIProviderName, ModelConfig } from "./types";
import { ReplicateProvider } from "./providers/replicate";
import { StabilityProvider } from "./providers/stability";
import { BytePlusProvider } from "./providers/byteplus";
const providerFactories: Record<AIProviderName, () => AIProvider> = {
  replicate: () => new ReplicateProvider(),
  stability: () => new StabilityProvider(),
  byteplus: () => new BytePlusProvider(),
};

// globalThis 캐싱으로 Next.js HMR 시에도 인스턴스 유지
const PROVIDER_CACHE_KEY = "__aiProviderCache";
const providerCache: Map<AIProviderName, AIProvider> =
  ((globalThis as Record<string, unknown>)[PROVIDER_CACHE_KEY] as Map<AIProviderName, AIProvider>) ??
  ((globalThis as Record<string, unknown>)[PROVIDER_CACHE_KEY] = new Map<AIProviderName, AIProvider>());

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

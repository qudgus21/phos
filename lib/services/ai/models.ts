import type { AIProviderName } from "./types";

export interface ModelDef {
  id: string;
  label: string;
  provider: AIProviderName;
  modelId: string;
  version?: string;
  maxImages: number;
  maxOutputs: number;
  supportedSizes: string[];
  defaults?: Record<string, unknown>;
}

export const IMAGE_EDIT_MODELS: ModelDef[] = [
  {
    id: "seedream-5.0",
    label: "Seedream 5.0",
    provider: "byteplus",
    modelId: "seedream-5.0",
    maxImages: 14,
    maxOutputs: 4,
    supportedSizes: ["1K", "2K", "4K"],
  },
  {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    provider: "byteplus",
    modelId: "seedream-4.5",
    maxImages: 14,
    maxOutputs: 4,
    supportedSizes: ["1K", "2K", "4K"],
  },
  {
    id: "nano-banana",
    label: "Nano Banana Pro",
    provider: "replicate",
    modelId: "google/nano-banana-pro",
    maxImages: 4,
    maxOutputs: 4,
    supportedSizes: ["1K", "2K"],
  },
  {
    id: "grok",
    label: "Grok Imagine",
    provider: "xai",
    modelId: "grok-2-image",
    maxImages: 3,
    maxOutputs: 4,
    supportedSizes: ["1K"],
  },
  {
    id: "flux-pro-1.1",
    label: "Flux Pro 1.1",
    provider: "replicate",
    modelId: "black-forest-labs/flux-1.1-pro",
    maxImages: 0,
    maxOutputs: 1,
    supportedSizes: ["1K", "2K", "4K"],
  },
];

export function getModelDef(id: string): ModelDef | undefined {
  return IMAGE_EDIT_MODELS.find((m) => m.id === id);
}

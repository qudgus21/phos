import type { AIProviderName } from "./types";

export interface StandardInput {
  prompt: string;
  images?: string[];
  width: number;
  height: number;
  ratio: string;
  imageCount: number;
  imageSize: string;
}

export interface ModelUiFeatures {
  ratio: boolean;
  customSize: boolean;
  imageSize: boolean;
}

export interface ModelDef {
  id: string;
  label: string;
  provider: AIProviderName;
  modelId: string;
  version?: string;
  maxImages: number;
  maxOutputs: number;
  supportedSizes: string[];
  ui: ModelUiFeatures;
  defaults?: Record<string, unknown>;
  buildInput: (params: StandardInput) => Record<string, unknown>;
}

export const IMAGE_EDIT_MODELS: ModelDef[] = [
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    provider: "replicate",
    modelId: "google/nano-banana-pro",
    maxImages: 14,
    maxOutputs: 1,
    supportedSizes: ["1K", "2K", "4K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio, imageSize }) => ({
      prompt,
      aspect_ratio:
        ratio === "AUTO"
          ? images && images.length > 0
            ? "match_input_image"
            : "1:1"
          : ratio,
      resolution: imageSize || "2K",
      output_format: "png",
      safety_filter_level: "block_only_high",
      ...(images && images.length > 0 && { image_input: images }),
    }),
  },
  {
    id: "nano-banana",
    label: "Nano Banana",
    provider: "replicate",
    modelId: "google/nano-banana",
    maxImages: 4,
    maxOutputs: 1,
    supportedSizes: ["1K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio }) => ({
      prompt,
      aspect_ratio:
        ratio === "AUTO"
          ? images && images.length > 0
            ? "match_input_image"
            : "1:1"
          : ratio,
      output_format: "png",
      ...(images && images.length > 0 && { image_input: images }),
    }),
  },
  {
    id: "seedream-5.0",
    label: "Seedream 5.0",
    provider: "replicate",
    modelId: "bytedance/seedream-5-lite",
    maxImages: 14,
    maxOutputs: 1,
    supportedSizes: ["2K", "3K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio, imageSize }) => ({
      prompt,
      size: imageSize === "4K" ? "3K" : "2K",
      aspect_ratio:
        ratio === "AUTO"
          ? images && images.length > 0
            ? "match_input_image"
            : "1:1"
          : ratio,
      output_format: "png",
      sequential_image_generation: "disabled",
      ...(images && images.length > 0 && { image_input: images }),
    }),
  },
  {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    provider: "replicate",
    modelId: "bytedance/seedream-4.5",
    maxImages: 14,
    maxOutputs: 1,
    supportedSizes: ["2K", "4K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio, imageSize, width, height }) => {
      const useCustom = imageSize === "custom";
      return {
        prompt,
        size: useCustom
          ? "custom"
          : imageSize === "4K"
            ? "4K"
            : "2K",
        aspect_ratio:
          ratio === "AUTO"
            ? images && images.length > 0
              ? "match_input_image"
              : "1:1"
            : ratio,
        output_format: "png",
        sequential_image_generation: "disabled",
        ...(useCustom && {
          width: Math.max(1024, Math.min(4096, width)),
          height: Math.max(1024, Math.min(4096, height)),
        }),
        ...(images && images.length > 0 && { image_input: images }),
      };
    },
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    provider: "replicate",
    modelId: "google/nano-banana-2",
    maxImages: 14,
    maxOutputs: 1,
    supportedSizes: ["1K", "2K", "4K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio, imageSize }) => ({
      prompt,
      aspect_ratio:
        ratio === "AUTO"
          ? images && images.length > 0
            ? "match_input_image"
            : "1:1"
          : ratio,
      resolution: imageSize || "1K",
      output_format: "png",
      ...(images && images.length > 0 && { image_input: images }),
    }),
  },
  {
    id: "seedream-4.0",
    label: "Seedream 4.0",
    provider: "replicate",
    modelId: "bytedance/seedream-4",
    maxImages: 10,
    maxOutputs: 1,
    supportedSizes: ["1K", "2K", "4K"],
    ui: { ratio: true, customSize: false, imageSize: true },
    buildInput: ({ prompt, images, ratio, imageSize, width, height }) => {
      const useCustom = imageSize === "custom";
      return {
        prompt,
        size: useCustom
          ? "custom"
          : imageSize === "4K"
            ? "4K"
            : imageSize === "1K"
              ? "1K"
              : "2K",
        aspect_ratio:
          ratio === "AUTO"
            ? images && images.length > 0
              ? "match_input_image"
              : "1:1"
            : ratio,
        output_format: "png",
        enhance_prompt: true,
        sequential_image_generation: "disabled",
        ...(useCustom && {
          width: Math.max(1024, Math.min(4096, width)),
          height: Math.max(1024, Math.min(4096, height)),
        }),
        ...(images && images.length > 0 && { image_input: images }),
      };
    },
  },
];

export function getModelDef(id: string): ModelDef | undefined {
  return IMAGE_EDIT_MODELS.find((m) => m.id === id);
}

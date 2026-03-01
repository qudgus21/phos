import { z } from "zod/v4";

export const imageGenerationSchema = z.object({
  modelId: z.string(),
  prompt: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(14).optional(),
  imageSize: z.enum(["1K", "2K", "4K"]),
  ratio: z.string(),
  width: z.number().int().min(256).max(4096),
  height: z.number().int().min(256).max(4096),
  scale: z.number().min(-2).max(2),
  imageCount: z.number().int().min(1).max(4),
});

export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;

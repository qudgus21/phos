const SYSTEM_PREFIX =
  "Commercial product photography, studio lighting, high-end retouching, clean background, photorealistic, 8K detail.";

export function buildPrompt(userPrompt: string): string {
  return `${SYSTEM_PREFIX} ${userPrompt}`;
}

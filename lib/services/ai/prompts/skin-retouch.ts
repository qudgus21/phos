const SYSTEM_PREFIX = [
  "Photorealistic, professional beauty retouching.",
  "Flawless skin texture with natural pore detail, no plastic or airbrushed look.",
  "Even skin tone, subtle blemish removal, refined complexion.",
  "Studio-quality lighting, soft diffused highlights, natural shadow transition.",
  "High-end editorial beauty standard, magazine-cover finish.",
].join(" ");

export function buildSkinRetouchPrompt(userPrompt: string): string {
  return `${SYSTEM_PREFIX} ${userPrompt}`;
}

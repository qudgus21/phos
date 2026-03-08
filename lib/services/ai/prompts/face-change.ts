const SYSTEM_PREFIX = [
  "Photorealistic face replacement with seamless integration.",
  "Matched skin tone, lighting direction, and shadow consistency.",
  "Natural facial proportions, accurate perspective alignment.",
  "Preserved original image context, clothing, and background.",
  "Undetectable composite, professional retouching quality.",
].join(" ");

export function buildFaceChangePrompt(userPrompt: string): string {
  return `${SYSTEM_PREFIX} ${userPrompt}`;
}

/* ── Skin Retouching Prompt Builder ── */

export interface SkinRetouchOptions {
  filter: "none" | "studio" | "brightening" | "glow";
  filterIntensity: number; // 0.0 – 1.0
  gender: "female" | "male";
  mode: "natural" | "soft-makeup" | "matte";
  excludedAreas: string[]; // e.g. ["lips","eyebrows","nose","hair","background","clothes"]
  faceReshape: boolean;
  faceReshapeIntensity: number; // 0.0 – 1.0
}

/* ── 1. System Prefix ── */
const SYSTEM_PREFIX = [
  "Professional beauty retouching of the provided photograph.",
  "This is an IMAGE EDITING task — the input photograph is the ground truth.",
  "Preserve the subject's identity exactly: same face shape, facial features, bone structure, skin tone, eye color, and all distinguishing characteristics.",
  "The result must be photorealistic and indistinguishable from a professionally retouched real photograph.",
  "No AI artifacts, no plastic or airbrushed appearance, no uncanny valley effects.",
  "Maintain natural skin pore texture and micro-detail throughout.",
  "CRITICAL: Do NOT change the pose, face angle, head tilt, gaze direction, body position, framing, or composition of the original image in any way. The spatial layout must remain pixel-identical to the input.",
].join(" ");

/* ── 2. Gender ── */
const GENDER_PROMPT: Record<string, string> = {
  female: [
    "Female portrait retouching.",
    "Maintain feminine facial structure.",
    "Smooth, polished skin with refined texture and luminosity.",
    "Even complexion with subtle radiance, like a high-end beauty advertisement.",
  ].join(" "),
  male: [
    "Male portrait retouching.",
    "Maintain masculine facial structure and skin texture.",
    "Minimize blemishes while keeping natural ruggedness and visible pore detail.",
    "Even skin tone without over-softening, like a premium editorial portrait.",
  ].join(" "),
};

/* ── 3. Mode ── */
const MODE_PROMPT: Record<string, string> = {
  natural: [
    "Natural retouching only. Clean, refined skin with no makeup added.",
    "Minimize blemishes, even skin tone, maintain all natural features.",
    "No foundation, concealer, or cosmetic enhancement.",
    "The result should look like a striking, editorial natural beauty portrait.",
  ].join(" "),
  "soft-makeup": [
    "Apply subtle, natural-looking soft makeup for a polished, refined appearance.",
    "Light foundation for even tone, gentle concealer under eyes, soft blush on cheeks, light lip tint, barely visible mascara.",
    "The makeup should look effortless and barely noticeable, like a high-end beauty campaign.",
  ].join(" "),
  matte: [
    "Apply matte finish makeup for a striking editorial beauty look.",
    "Full-coverage matte foundation, mattified T-zone, defined contour lines, matte lipstick, structured eyebrows, visible but refined eyeliner.",
    "Professional editorial matte beauty look, polished and refined like a magazine cover.",
  ].join(" "),
};

/* ── 4. Filter + Intensity ── */
function getIntensityAdverb(intensity: number): string {
  if (intensity <= 0.3) return "Subtly";
  if (intensity <= 0.6) return "Moderately";
  if (intensity <= 0.8) return "Prominently";
  return "Dramatically";
}

const FILTER_PROMPT: Record<string, (adverb: string) => string> = {
  studio: (adv) =>
    [
      `${adv} apply studio lighting for a polished, high-end commercial look:`,
      "controlled directional key light with fill light,",
      "professional catchlights in eyes,",
      "neutral-warm color temperature (~5500K), clean specular highlights on skin.",
      "Keep shadows minimal and close to original. The result should look like a professional beauty studio photograph.",
    ].join(" "),
  brightening: (adv) =>
    [
      `${adv} brighten the image for a striking, refined appearance:`,
      "lifted shadows, increased luminosity in midtones,",
      "bright and airy feel, slightly warm highlights,",
      "open shadow detail, high-key lighting tendency.",
      "The skin should look radiant and polished like a high-end beauty editorial.",
    ].join(" "),
  glow: (adv) =>
    [
      `${adv} add a natural skin glow for a striking, editorial beauty look:`,
      "luminous, healthy-looking skin with a dewy finish,",
      "soft light reflecting off the skin surface,",
      "subtle inner radiance without oily or sweaty appearance,",
      "enhanced skin luminosity while maintaining texture and pore detail.",
      "The skin should look alive and vibrant, polished and refined like a beauty campaign.",
    ].join(" "),
};

/* ── 5. Face Reshape ── */
function buildFaceReshapePrompt(intensity: number): string {
  const adverb =
    intensity <= 0.3 ? "Subtly" : intensity <= 0.6 ? "Noticeably" : "Dramatically";

  const reshapeDetails =
    intensity <= 0.3
      ? "slimmer jawline toward a V-shape, refined nose bridge and tip, smoother forehead line, slightly lifted cheekbones. Changes should look natural as if the person simply has flattering angles."
      : intensity <= 0.6
        ? "defined V-line jaw, slimmer and refined nose, reduced cheekbone width, smooth and balanced forehead contour, overall more sculpted and defined facial structure. Results should still look like the same person, just more refined."
        : "sharp and defined V-line jaw with tapered chin, visibly slimmer and straighter nose with refined tip, high and sculpted cheekbones with subtle hollowing underneath, smaller overall face proportion (소두 effect), smooth and lifted forehead contour, balanced facial symmetry. The result should look like a high-end beauty magazine cover — polished and refined, but still recognizably the same person.";

  return [
    `${adverb} reshape facial contours for a striking, editorial beauty look:`,
    reshapeDetails,
    "Avoid cartoonish, plastic, or CGI-like distortion.",
    "CRITICAL: Do NOT change the face angle, head tilt, pose, gaze direction, or camera perspective in any way.",
    "The composition must remain pixel-identical to the original photograph. Only modify the contour shapes within the existing pose.",
  ].join(" ");
}

/* ── 6. Excluded Areas ── */
const AREA_PRESERVE: Record<string, string> = {
  lips: "Do NOT modify the lips in any way. Keep original lip color, shape, texture, and any existing lip product exactly as-is.",
  eyebrows:
    "Do NOT modify the eyebrows. Keep original eyebrow shape, color, thickness, and grooming exactly as-is.",
  nose: "Do NOT modify the nose. Keep original nose shape, size, skin texture, and contour exactly as-is.",
  hair: "Do NOT modify the hair. Keep original hairstyle, color, texture, volume, and flyaways exactly as-is.",
  background:
    "Do NOT modify the background. Keep the original background scene, colors, blur, and lighting exactly as-is.",
  clothes:
    "Do NOT modify the clothing. Keep original garments, colors, textures, wrinkles, and accessories exactly as-is.",
};

/* ── 7. Quality Suffix ── */
const QUALITY_SUFFIX = [
  "Output at professional commercial photography standard suitable for beauty advertising and editorial print.",
  "Ultra-sharp detail, accurate color reproduction, natural lighting consistency.",
  "The final result should be polished and refined, worthy of a high-end beauty magazine cover.",
].join(" ");

/* ── Builder ── */
export function buildSkinRetouchPrompt(options: SkinRetouchOptions): string {
  const segments: string[] = [];

  // 1. System prefix
  segments.push(SYSTEM_PREFIX);

  // 2. Gender
  segments.push(GENDER_PROMPT[options.gender] ?? GENDER_PROMPT.female);

  // 3. Mode
  segments.push(MODE_PROMPT[options.mode] ?? MODE_PROMPT.natural);

  // 4. Filter
  if (options.filter !== "none" && FILTER_PROMPT[options.filter]) {
    const adverb = getIntensityAdverb(options.filterIntensity);
    segments.push(FILTER_PROMPT[options.filter](adverb));
  }

  // 5. Face reshape
  if (options.faceReshape) {
    segments.push(buildFaceReshapePrompt(options.faceReshapeIntensity));
  }

  // 6. Excluded areas
  if (options.excludedAreas.length > 0) {
    const preserveInstructions = options.excludedAreas
      .filter((area) => AREA_PRESERVE[area])
      .map((area) => AREA_PRESERVE[area]);
    if (preserveInstructions.length > 0) {
      segments.push(preserveInstructions.join(" "));
    }
  } else {
    segments.push(
      "Apply retouching to all visible areas including skin, hair, and background elements as appropriate."
    );
  }

  // 7. Quality suffix
  segments.push(QUALITY_SUFFIX);

  return segments.join(" ");
}

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
    "Maintain masculine facial structure.",
    "Smooth, clean skin with refined texture — remove blemishes, dark spots, and uneven patches thoroughly.",
    "Even complexion with healthy clarity, like a high-end men's fashion advertisement.",
    "No visible cosmetic makeup — all enhancement must look naturally achieved.",
  ].join(" "),
};

/* ── 3. Mode ── */
const MODE_PROMPT: Record<string, Record<string, string>> = {
  natural: {
    female: [
      "Natural retouching only. Clean, refined skin with no makeup added.",
      "Minimize blemishes, even skin tone, maintain all natural features.",
      "No foundation, concealer, or cosmetic enhancement.",
      "The result should look like a striking, editorial natural beauty portrait.",
    ].join(" "),
    male: [
      "Natural retouching only. Clean, refined skin with no visible makeup.",
      "Thoroughly remove blemishes, dark spots, acne scars, enlarged pores, and uneven patches.",
      "Smooth and even out skin tone and texture across the entire face — refine pore texture, reduce fine lines, and eliminate any roughness or dullness.",
      "No visible foundation or cosmetic products — all improvement must look naturally achieved.",
      "The result should look like a premium men's editorial portrait — clean, polished skin that looks naturally flawless.",
    ].join(" "),
  },
  "soft-makeup": {
    female: [
      "Apply subtle, natural-looking soft makeup for a polished, refined appearance.",
      "Light foundation for even tone, gentle concealer under eyes, soft blush on cheeks, light lip tint, barely visible mascara, thin and subtle eyeliner along the upper lash line.",
      "The makeup should look effortless and barely noticeable, like a high-end beauty campaign.",
    ].join(" "),
    male: [
      "Apply invisible grooming-level enhancement for a polished, refined editorial look.",
      "Thoroughly clean up all skin imperfections across the entire face — remove blemishes, dark spots, enlarged pores, acne scars, and rough texture.",
      "Even out skin tone, neutralize dark circles and redness, mattify T-zone, smooth under-eye area, refine pore texture for a clean and smooth complexion.",
      "Do NOT touch eyelashes, eyeliner area, or add any eye makeup effects. Enhancement must be strong but with zero visible cosmetic makeup — the result should look like exceptionally well-maintained skin, like a premium men's fashion campaign.",
    ].join(" "),
  },
  matte: {
    female: [
      "Apply matte finish makeup for a striking editorial beauty look.",
      "Full-coverage matte foundation, mattified T-zone, defined contour lines, matte lipstick, structured eyebrows, visible but refined eyeliner.",
      "Professional editorial matte beauty look, polished and refined like a magazine cover.",
    ].join(" "),
    male: [
      "Apply a strong matte finish for a bold, editorial men's look.",
      "Thoroughly clean up all skin imperfections — remove blemishes, dark spots, enlarged pores, acne scars, rough texture, and uneven patches across the entire face.",
      "Full matte skin with zero shine, refined pore texture, sharply defined jawline contour, mattified forehead and nose, enhanced facial definition through shadow and highlight control.",
      "Do NOT touch eyelashes, eyeliner area, or add any eye makeup effects. The result should look like a high-end men's magazine cover — powerful, sculpted, and commanding.",
    ].join(" "),
  },
};

/* ── 4. Filter + Intensity ── */
function getIntensityAdverb(intensity: number): string {
  if (intensity <= 0.3) return "Subtly";
  if (intensity <= 0.6) return "Moderately";
  if (intensity <= 0.8) return "Prominently";
  return "Dramatically";
}

const FILTER_PROMPT: Record<string, Record<string, (adverb: string) => string>> = {
  studio: {
    female: (adv) =>
      [
        `${adv} apply studio lighting for a polished, high-end commercial look:`,
        "controlled directional key light with fill light,",
        "professional catchlights in eyes,",
        "neutral-warm color temperature (~5500K), clean specular highlights on skin.",
        "Keep shadows minimal and close to original. The result should look like a professional beauty studio photograph.",
      ].join(" "),
    male: (adv) =>
      [
        `${adv} apply studio lighting for a sharp, high-end commercial look:`,
        "controlled directional key light with deeper fill ratio for stronger shadow definition,",
        "professional catchlights in eyes,",
        "neutral color temperature (~5200K), clean specular highlights emphasizing facial structure.",
        "Maintain masculine shadow depth on jawline and cheekbones. The result should look like a premium men's studio portrait.",
      ].join(" "),
  },
  brightening: {
    female: (adv) =>
      [
        `${adv} brighten the image for a striking, refined appearance:`,
        "lifted shadows, increased luminosity in midtones,",
        "bright and airy feel, slightly warm highlights,",
        "open shadow detail, high-key lighting tendency.",
        "The skin should look radiant and polished like a high-end beauty editorial.",
      ].join(" "),
    male: (adv) =>
      [
        `${adv} brighten the image for a clean, sharp appearance:`,
        "lifted shadows, increased clarity in midtones,",
        "bright and clean feel with neutral-warm highlights,",
        "open shadow detail while preserving masculine facial depth.",
        "The skin should look fresh and healthy like a premium men's editorial — bright but never soft.",
      ].join(" "),
  },
  glow: {
    female: (adv) =>
      [
        `${adv} add a natural skin glow for a striking, editorial beauty look:`,
        "luminous, healthy-looking skin with a dewy finish,",
        "soft light reflecting off the skin surface,",
        "subtle inner radiance without oily or sweaty appearance,",
        "enhanced skin luminosity while maintaining texture and pore detail.",
        "The skin should look alive and vibrant, polished and refined like a beauty campaign.",
      ].join(" "),
    male: (adv) =>
      [
        `${adv} add a natural, healthy skin glow for a sharp editorial look:`,
        "clean, healthy-looking skin with controlled sheen on high points (forehead, nose bridge, cheekbones),",
        "natural light interaction that emphasizes skin vitality,",
        "subtle radiance without dewy or greasy appearance,",
        "enhanced skin clarity while fully preserving pore texture and masculine detail.",
        "The skin should look vital and energized like a premium men's grooming campaign — never soft or glossy.",
      ].join(" "),
  },
};

/* ── 5. Face Reshape ── */
function buildFaceReshapePrompt(intensity: number, gender: string): string {
  const adverb =
    intensity <= 0.3 ? "Subtly" : intensity <= 0.6 ? "Noticeably" : "Dramatically";

  const isMale = gender === "male";

  const reshapeDetails = isMale
    ? intensity <= 0.3
      ? "sharper jawline definition, slightly refined nose bridge, cleaner forehead line, subtle cheekbone emphasis, slightly reduced overall face proportion. Changes should look natural as if the person simply has strong bone structure."
      : intensity <= 0.6
        ? "defined angular jaw with sharper edges, refined nose with straighter bridge, pronounced cheekbone structure, clean forehead contour, smaller overall face proportion (소두 effect), overall more chiseled and defined facial structure. Results should still look like the same person, just more sculpted."
        : "strongly defined angular jaw with sharp edges, visibly straighter and refined nose, high and pronounced cheekbones with strong shadow underneath, defined brow ridge, smaller overall face proportion (소두 effect), clean and balanced forehead contour, balanced facial symmetry. The result should look like a high-end men's magazine cover — powerful, chiseled, and commanding, but still recognizably the same person."
    : intensity <= 0.3
      ? "slimmer jawline toward a V-shape, refined nose bridge and tip, smoother forehead line, slightly lifted cheekbones. Changes should look natural as if the person simply has flattering angles."
      : intensity <= 0.6
        ? "defined V-line jaw, slimmer and refined nose, reduced cheekbone width, smooth and balanced forehead contour, overall more sculpted and defined facial structure. Results should still look like the same person, just more refined."
        : "sharp and defined V-line jaw with tapered chin, visibly slimmer and straighter nose with refined tip, high and sculpted cheekbones with subtle hollowing underneath, smaller overall face proportion (소두 effect), smooth and lifted forehead contour, balanced facial symmetry. The result should look like a high-end beauty magazine cover — polished and refined, but still recognizably the same person.";

  const lookDesc = isMale
    ? "a powerful, chiseled editorial men's look"
    : "a striking, editorial beauty look";

  return [
    `${adverb} reshape facial contours for ${lookDesc}:`,
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
  const modeGroup = MODE_PROMPT[options.mode] ?? MODE_PROMPT.natural;
  segments.push(modeGroup[options.gender] ?? modeGroup.female);

  // 4. Filter
  if (options.filter !== "none" && FILTER_PROMPT[options.filter]) {
    const adverb = getIntensityAdverb(options.filterIntensity);
    const filterGroup = FILTER_PROMPT[options.filter];
    const filterFn = filterGroup[options.gender] ?? filterGroup.female;
    segments.push(filterFn(adverb));
  }

  // 5. Face reshape
  if (options.faceReshape) {
    segments.push(buildFaceReshapePrompt(options.faceReshapeIntensity, options.gender));
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

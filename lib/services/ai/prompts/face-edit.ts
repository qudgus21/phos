/**
 * FLUX Fill Pro 인페인팅용 프롬프트 빌더 — 얼굴 변경 전용
 *
 * 핵심 원칙:
 * 1. 마스크 영역(흰색)만 변경, 마스크 밖(검정)은 절대 변경 금지
 * 2. 조명, 피부톤, 원근감은 원본과 완벽히 일치
 * 3. 성별에 따라 자연스러운 얼굴 특성 생성
 */

const SHARED_PREFIX = [
  "Inpaint only the white-masked region.",
  "Preserve every pixel outside the mask exactly as-is: same background, clothing, hair, body, accessories, lighting, color grading, and camera angle.",
  "The inpainted area must blend seamlessly with the surrounding pixels — matched skin tone, lighting direction, shadow placement, and texture continuity.",
  "Photorealistic result, high-end commercial retouching quality.",
  "Natural facial proportions and accurate perspective alignment with the original image.",
  "No artifacts, no visible seams, no style drift outside the mask.",
].join(" ");

const FEMALE_PROMPT = [
  SHARED_PREFIX,
  "Generate a beautiful young woman's face in the masked area.",
  "Soft, clear skin with natural subtle makeup.",
  "Well-defined but natural features: bright eyes, gentle brow shape, natural lip color.",
  "Skin texture must match the surrounding area — same warmth, undertone, and lighting response.",
  "Professional beauty photography quality, studio-grade retouching.",
].join(" ");

const MALE_PROMPT = [
  SHARED_PREFIX,
  "Generate a handsome young man's face in the masked area.",
  "Clean, clear skin with natural healthy complexion.",
  "Well-defined masculine features: strong jawline, natural brow, sharp eyes.",
  "Skin texture must match the surrounding area — same warmth, undertone, and lighting response.",
  "Professional portrait photography quality, natural grooming look.",
].join(" ");

export function buildFaceEditPrompt(gender: "female" | "male"): string {
  return gender === "female" ? FEMALE_PROMPT : MALE_PROMPT;
}

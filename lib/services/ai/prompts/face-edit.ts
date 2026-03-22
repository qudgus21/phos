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
  "Keep the original face identity as much as possible — same bone structure, face shape, and overall appearance.",
  "Preserve everything outside the mask exactly as-is.",
  "The inpainted area must blend seamlessly with the surrounding region — matched skin tone, lighting, shadow, and texture.",
  "Photorealistic, natural result. No artifacts, no visible seams.",
].join(" ");

const FEMALE_PROMPT = [
  SHARED_PREFIX,
  "Naturally enhance the female face in the masked area.",
  "Clean, clear skin. Subtle natural makeup look.",
  "Maintain the original facial features and identity.",
].join(" ");

const MALE_PROMPT = [
  SHARED_PREFIX,
  "Naturally enhance the male face in the masked area.",
  "Clean, clear skin. Natural healthy complexion.",
  "Maintain the original facial features and identity.",
].join(" ");

export function buildFaceEditPrompt(gender: "female" | "male"): string {
  return gender === "female" ? FEMALE_PROMPT : MALE_PROMPT;
}

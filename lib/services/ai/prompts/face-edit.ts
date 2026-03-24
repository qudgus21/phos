/**
 * FLUX Fill Pro 인페인팅용 프롬프트 빌더 — 얼굴 변경 전용
 *
 * FLUX Fill Pro는 mask 입력을 이미 받으므로, 프롬프트에 마스크 관련 메타 지시를 넣으면
 * 오히려 혼동을 준다. 프롬프트는 마스크 영역에 **무엇을** 그려야 하는지만 기술한다.
 */

const FEMALE_PROMPT = [
  "Beautiful natural female face, photorealistic.",
  "Smooth clear skin, subtle natural makeup, natural lip color.",
  "Seamless skin texture, matching surrounding lighting and skin tone.",
  "High-end beauty photography, shot on DSLR, 85mm lens.",
].join(" ");

const MALE_PROMPT = [
  "Handsome natural male face, photorealistic.",
  "Clean clear skin, natural healthy complexion.",
  "Seamless skin texture, matching surrounding lighting and skin tone.",
  "High-end portrait photography, shot on DSLR, 85mm lens.",
].join(" ");

export function buildFaceEditPrompt(gender: "female" | "male"): string {
  return gender === "female" ? FEMALE_PROMPT : MALE_PROMPT;
}

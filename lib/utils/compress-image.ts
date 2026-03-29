/**
 * 클라이언트 사이드 이미지 압축 유틸리티
 * Canvas API를 사용하여 이미지를 리사이즈 + WebP 변환
 */

const MAX_LONG_SIDE = 1024;
const MAX_LONG_SIDE_INPUT = 2048;
const WEBP_QUALITY = 0.8;
const WEBP_QUALITY_INPUT = 0.85;

/**
 * 이미지를 1K WebP로 압축
 * - 긴 변이 1024px 이하: WebP 변환만
 * - 긴 변이 1024px 초과: 1024px로 리사이즈 + WebP 변환
 * @param source File 객체 또는 이미지 URL
 * @returns 압축된 WebP Blob
 */
export async function compressImageForFavorite(
  source: File | string
): Promise<Blob> {
  return compressImage(source, MAX_LONG_SIDE, WEBP_QUALITY);
}

/**
 * 에디터 입력용 이미지 압축 (2K WebP)
 * - 긴 변이 2048px 이하: WebP 변환만
 * - 긴 변이 2048px 초과: 2048px로 리사이즈 + WebP 변환
 * @param source File 객체 또는 이미지 URL
 * @returns 압축된 WebP File
 */
export async function compressImageForInput(
  source: File | string
): Promise<File> {
  const blob = await compressImage(source, MAX_LONG_SIDE_INPUT, WEBP_QUALITY_INPUT);
  const name = source instanceof File
    ? source.name.replace(/\.[^.]+$/, ".webp")
    : `input-${Date.now()}.webp`;
  return new File([blob], name, { type: "image/webp" });
}

async function compressImage(
  source: File | string,
  maxLongSide: number,
  quality: number,
): Promise<Blob> {
  let blob: Blob;
  if (source instanceof File) {
    blob = source;
  } else {
    const res = await fetch(source);
    blob = await res.blob();
  }

  const bitmap = await createImageBitmap(blob);

  let { width, height } = bitmap;
  if (width > maxLongSide || height > maxLongSide) {
    const ratio = maxLongSide / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했습니다"))),
      "image/webp",
      quality
    )
  );
}

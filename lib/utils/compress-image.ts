/**
 * 클라이언트 사이드 이미지 압축 유틸리티
 * Canvas API를 사용하여 이미지를 리사이즈 + WebP 변환
 */

const MAX_LONG_SIDE = 2048;
const WEBP_QUALITY = 0.8;

/**
 * 이미지를 2K WebP로 압축
 * @param source File 객체 또는 이미지 URL
 * @returns 압축된 WebP Blob
 */
export async function compressImageForFavorite(
  source: File | string
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
  if (width > MAX_LONG_SIDE || height > MAX_LONG_SIDE) {
    const ratio = MAX_LONG_SIDE / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/webp", WEBP_QUALITY)
  );
}

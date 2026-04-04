export type ImageFormat = "png" | "jpg" | "webp";

const STORAGE_KEY = "phos-download-format";

export function getLastFormat(): ImageFormat {
  if (typeof window === "undefined") return "png";
  return (localStorage.getItem(STORAGE_KEY) as ImageFormat) || "png";
}

export function setLastFormat(format: ImageFormat) {
  localStorage.setItem(STORAGE_KEY, format);
}

const MIME_MAP: Record<ImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export async function downloadImage(src: string, format: ImageFormat = "png") {
  const res = await fetch(src);
  const blob = await res.blob();

  let finalBlob: Blob;

  if (format === "webp") {
    // WebP: 원본 그대로 다운로드 (소스가 이미 WebP)
    finalBlob = blob;
  } else {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const mime = MIME_MAP[format];
    const quality = format === "jpg" ? 0.95 : undefined;
    finalBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했습니다"))),
        mime,
        quality,
      ),
    );
  }

  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement("a");
  a.href = url;
  const baseName =
    src.split("/").pop()?.split("?")[0]?.replace(/\.\w+$/, "") || "image";
  a.download = `${baseName}.${format === "jpg" ? "jpg" : format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setLastFormat(format);
}

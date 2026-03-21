import { ApiError } from "@/lib/errors";

const REPLICATE_FILES_URL = "https://api.replicate.com/v1/files";

/**
 * 파일을 Replicate Files API에 업로드하고 URL을 반환한다.
 * 반환된 URL은 Replicate prediction의 input으로 직접 사용 가능.
 */
export async function uploadFileToReplicate(
  file: File | Blob,
  filename?: string
): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new ApiError("REPLICATE_API_TOKEN 환경변수가 설정되지 않았습니다", 500);
  }

  const form = new FormData();
  form.append("content", file, filename || `ref-${Date.now()}.png`);

  const res = await fetch(REPLICATE_FILES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[replicate-files] upload failed (${res.status}):`, text);
    throw new ApiError("이미지 업로드 중 오류가 발생했습니다", 502);
  }

  const data = (await res.json()) as { urls?: { get?: string } };
  if (!data.urls?.get) {
    throw new ApiError("Replicate Files 응답에 URL이 없습니다", 502);
  }
  return data.urls.get;
}

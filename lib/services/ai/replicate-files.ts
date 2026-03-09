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
    throw new ApiError(`Replicate Files 업로드 실패 (${res.status}): ${text}`, 502);
  }

  const data = await res.json();
  return data.urls.get;
}

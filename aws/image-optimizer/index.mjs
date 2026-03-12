import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "generation-outputs";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * 이미지 URL에서 buffer를 가져온다.
 * 최대 3회 재시도, 타임아웃 30초.
 */
async function fetchImage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/**
 * Sharp로 display WebP 변환 (1200px, q80)
 * — 화면 표시용으로 가장 먼저 필요하므로 별도 분리
 */
async function processDisplay(buffer) {
  return sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Sharp로 thumb + original WebP 변환
 * - thumb:    200px 짧은 변, q70
 * - original: 원본 해상도, q90
 */
async function processThumbAndOriginal(buffer) {
  const [thumb, original] = await Promise.all([
    sharp(buffer)
      .resize(200, 200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer(),
    sharp(buffer).webp({ quality: 90 }).toBuffer(),
  ]);
  return { thumb, original };
}

/**
 * Supabase Storage에 업로드하고 public URL 반환
 */
async function uploadToStorage(buffer, path) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/webp",
    upsert: false,
  });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Lambda 핸들러
 *
 * 요청 body:
 * {
 *   historyId: string,       // generation_history row ID
 *   userId: string,          // user ID (storage 경로용)
 *   outputUrls: string[],    // AI 생성 임시 URL들
 * }
 */
export const handler = async (event) => {
  // AWS SDK InvokeCommand는 payload를 직접 전달 (JSON 객체)
  // Function URL 호출 시에는 body가 문자열로 올 수 있으므로 둘 다 처리
  const payload = typeof event.body === "string"
    ? JSON.parse(event.body)
    : event.body ?? event;

  const { historyId, userId, outputUrls } = payload;

  if (!historyId || !userId || !Array.isArray(outputUrls) || outputUrls.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const timestamp = Date.now();
  const prefix = `${userId}/${timestamp}`;
  const thumbUrls = [];
  const displayUrls = [];
  const originalUrls = [];
  const errors = [];

  // ── Phase 1: display 변환 + 즉시 DB 업데이트 (화면 표시 최우선) ──
  const buffers = []; // Phase 2에서 재사용할 원본 버퍼

  for (let i = 0; i < outputUrls.length; i++) {
    const url = outputUrls[i];
    try {
      console.log(`[${i + 1}/${outputUrls.length}] Fetching: ${url.substring(0, 80)}...`);
      const buffer = await fetchImage(url);
      console.log(`[${i + 1}] Fetched ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
      buffers.push(buffer);

      const displayBuf = await processDisplay(buffer);
      console.log(`[${i + 1}] Display: ${(displayBuf.length / 1024).toFixed(0)}KB`);

      const displayUrl = await uploadToStorage(displayBuf, `${prefix}-display-${i}.webp`);
      displayUrls.push(displayUrl);
    } catch (err) {
      console.error(`[${i + 1}] Display failed:`, err.message);
      errors.push({ index: i, phase: "display", error: err.message });
      buffers.push(null);
      displayUrls.push(null);
    }
  }

  // display 완료 즉시 DB 업데이트 → 히스토리에서 최적화 이미지 바로 노출
  const hasDisplay = displayUrls.some((u) => u !== null);
  if (hasDisplay) {
    await supabase
      .from("generation_history")
      .update({ display_urls: displayUrls })
      .eq("id", historyId);
    console.log(`[Phase1] display_urls updated for historyId=${historyId}`);
  }

  // ── Phase 2: thumb + original 변환 ──
  for (let i = 0; i < outputUrls.length; i++) {
    const buffer = buffers[i];
    if (!buffer) {
      thumbUrls.push(null);
      originalUrls.push(null);
      continue;
    }

    try {
      const { thumb, original } = await processThumbAndOriginal(buffer);
      console.log(
        `[${i + 1}] Thumb: ${(thumb.length / 1024).toFixed(0)}KB, ` +
        `Original: ${(original.length / 1024).toFixed(0)}KB`
      );

      const [thumbUrl, originalUrl] = await Promise.all([
        uploadToStorage(thumb, `${prefix}-thumb-${i}.webp`),
        uploadToStorage(original, `${prefix}-original-${i}.webp`),
      ]);

      thumbUrls.push(thumbUrl);
      originalUrls.push(originalUrl);
    } catch (err) {
      console.error(`[${i + 1}] Thumb/Original failed:`, err.message);
      errors.push({ index: i, phase: "thumb_original", error: err.message });
      thumbUrls.push(null);
      originalUrls.push(null);
    }
  }

  // 최종 DB 업데이트 (thumb + original + display 전체)
  const successCount = displayUrls.filter((u) => u !== null).length;

  if (successCount === 0) {
    console.error(`[Failed] historyId=${historyId}, all ${outputUrls.length} images failed`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "All images failed", errors }),
    };
  }

  const { error: dbError } = await supabase
    .from("generation_history")
    .update({
      thumb_urls: thumbUrls,
      display_urls: displayUrls,
      original_urls: originalUrls,
    })
    .eq("id", historyId);

  if (dbError) {
    console.error("[DB] Update failed:", dbError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "DB update failed", detail: dbError.message }),
    };
  }

  console.log(`[Done] historyId=${historyId}, ${successCount}/${outputUrls.length} succeeded`);

  return {
    statusCode: successCount === outputUrls.length ? 200 : 207,
    body: JSON.stringify({
      success: true,
      historyId,
      thumbUrls,
      displayUrls,
      originalUrls,
      ...(errors.length > 0 && { errors }),
    }),
  }
};

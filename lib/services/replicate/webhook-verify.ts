import crypto from "crypto";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60; // ±5분

interface VerifySuccess {
  valid: true;
}
interface VerifyFailure {
  valid: false;
  reason: string;
}
type VerifyResult = VerifySuccess | VerifyFailure;

/**
 * Replicate webhook 서명을 검증한다.
 * https://replicate.com/docs/topics/webhooks/verify-webhook
 *
 * Headers:
 *   webhook-id        — 고유 메시지 ID (재전송 시 동일)
 *   webhook-timestamp — epoch seconds
 *   webhook-signature — "v1,<base64>" 형태 (쉼표로 여러 서명 가능)
 *
 * 서명 대상: `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * 알고리즘: HMAC-SHA256, base64 인코딩
 */
export function verifyWebhookSignature(
  rawBody: string,
  headers: {
    "webhook-id"?: string | null;
    "webhook-timestamp"?: string | null;
    "webhook-signature"?: string | null;
  }
): VerifyResult {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: false, reason: "REPLICATE_WEBHOOK_SECRET is not set" };
  }

  const webhookId = headers["webhook-id"];
  const webhookTimestamp = headers["webhook-timestamp"];
  const webhookSignature = headers["webhook-signature"];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { valid: false, reason: "Missing required webhook headers" };
  }

  // timestamp 검증 (replay attack 방지)
  const ts = parseInt(webhookTimestamp, 10);
  if (isNaN(ts)) {
    return { valid: false, reason: "Invalid webhook timestamp" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { valid: false, reason: "Webhook timestamp too old or too far in the future" };
  }

  // signing key: whsec_ prefix 제거 후 base64 decode
  const keyBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const signingKey = Buffer.from(keyBase64, "base64");

  // HMAC-SHA256 ���산
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", signingKey)
    .update(signedContent)
    .digest("base64");

  // webhook-signature 헤더에서 v1 서명 추출 후 비교
  // 형식: "v1,<base64> v1,<base64>" (공백 구분, 여러 서명 가능)
  const signatures = webhookSignature.split(" ");
  for (const sig of signatures) {
    const parts = sig.split(",");
    if (parts[0] !== "v1" || !parts[1]) continue;

    const candidateSig = parts[1];
    const expectedBuf = Buffer.from(expectedSig);
    const candidateBuf = Buffer.from(candidateSig);

    if (
      expectedBuf.length === candidateBuf.length &&
      crypto.timingSafeEqual(expectedBuf, candidateBuf)
    ) {
      return { valid: true };
    }
  }

  return { valid: false, reason: "Signature mismatch" };
}

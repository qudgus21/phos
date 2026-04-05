/**
 * Replicate webhook URL을 반환한다.
 * REPLICATE_WEBHOOK_URL이 설정되어 있으면 그 값을 사용 (로컬 개발 시 ngrok 등).
 * 없으면 NEXT_PUBLIC_APP_URL 기반으로 구성.
 */
export function getReplicateWebhookUrl(): string {
  const override = process.env.REPLICATE_WEBHOOK_URL;
  if (override) return override;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or REPLICATE_WEBHOOK_URL must be set");
  }

  return `${appUrl}/api/webhook/replicate`;
}

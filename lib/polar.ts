import { Polar } from "@polar-sh/sdk";

/**
 * Polar SDK 클라이언트 생성 (서버 사이드 전용)
 * NOTE: Polar 샌드박스 토큰 사용, 항상 sandbox 모드로 실행
 */
export function createPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing POLAR_ACCESS_TOKEN");

  return new Polar({
    accessToken,
    server: "sandbox",
  });
}

import { Polar } from "@polar-sh/sdk";

/**
 * Polar SDK 클라이언트 생성 (서버 사이드 전용)
 */
export function createPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing POLAR_ACCESS_TOKEN");

  return new Polar({
    accessToken,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  });
}

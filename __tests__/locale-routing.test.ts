/**
 * i18n 로케일 라우팅 테스트
 *
 * 실행 전 Next.js 서버가 실행 중이어야 함:
 *   yarn dev (or yarn start)
 *
 * 실행:
 *   npx vitest run __tests__/locale-routing.test.ts
 *
 * 환경변수:
 *   TEST_BASE_URL — 기본값: http://localhost:3000
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

// Fetch with manual redirect handling
async function fetchNoRedirect(url: string, headers: Record<string, string> = {}) {
  return fetch(url, { redirect: "manual", headers });
}

async function fetchHtml(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  const html = await res.text();
  return { res, html };
}

describe("Locale routing", () => {
  describe("Root redirect", () => {
    it("/ redirects to /en by default (no Accept-Language)", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/`);
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/en(\/|$)/);
    });

    it("/ with Accept-Language: ko redirects to /ko", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/`, {
        "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      });
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/ko(\/|$)/);
    });

    it("/ with Accept-Language: ja redirects to /ja", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/`, {
        "accept-language": "ja-JP,ja;q=0.9",
      });
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/ja(\/|$)/);
    });

    it("/ with Accept-Language: zh-CN redirects to /zh", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/`, {
        "accept-language": "zh-CN,zh;q=0.9",
      });
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/zh(\/|$)/);
    });

    it("/ with unknown Accept-Language falls back to /en", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/`, {
        "accept-language": "xx-YY",
      });
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/en(\/|$)/);
    });
  });

  describe("Path-without-locale redirect", () => {
    it("/image-edit redirects to /{locale}/image-edit", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/image-edit`);
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/[a-z]{2}\/image-edit/);
    });

    it("/pricing redirects to /{locale}/pricing", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/pricing`);
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
      const location = res.headers.get("location") ?? "";
      expect(location).toMatch(/\/[a-z]{2}\/pricing/);
    });
  });

  describe("Locale pages render", () => {
    const localesToCheck = ["en", "ko", "ja", "zh", "es", "fr", "de", "ru", "pt", "id", "ar"];

    for (const locale of localesToCheck) {
      it(`/${locale} returns 200`, async () => {
        const { res } = await fetchHtml(`${BASE_URL}/${locale}`);
        expect(res.status).toBe(200);
      });
    }
  });

  describe("HTML lang attribute", () => {
    it("/en has lang='en'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/en`);
      expect(html).toMatch(/lang="en"/);
    });

    it("/ko has lang='ko'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/ko`);
      expect(html).toMatch(/lang="ko"/);
    });

    it("/ja has lang='ja'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/ja`);
      expect(html).toMatch(/lang="ja"/);
    });

    it("/ar has lang='ar'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/ar`);
      expect(html).toMatch(/lang="ar"/);
    });

    it("/ar has dir='rtl'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/ar`);
      expect(html).toMatch(/dir="rtl"/);
    });

    it("/en does NOT have dir='rtl'", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/en`);
      expect(html).not.toMatch(/dir="rtl"/);
    });
  });

  describe("hreflang alternate links", () => {
    it("/en/pricing has hreflang alternate for all 11 locales", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/en/pricing`);
      const locales = ["ko", "en", "zh", "es", "ar", "id", "pt", "fr", "ja", "ru", "de"];
      for (const locale of locales) {
        expect(html).toMatch(new RegExp(`hreflang="${locale}"`));
      }
    });

    it("/en/pricing has x-default hreflang", async () => {
      const { html } = await fetchHtml(`${BASE_URL}/en/pricing`);
      expect(html).toMatch(/hreflang="x-default"/);
    });
  });

  describe("Invalid locale returns 404", () => {
    it("/xx (invalid locale) returns 404", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/xx`);
      // Either 404 directly or redirects then 404 — the end result should not be 200
      // For Next.js notFound(), it typically returns 404
      if (res.status >= 300 && res.status < 400) {
        // If it redirected, follow and check
        const location = res.headers.get("location");
        if (location) {
          const finalRes = await fetch(location);
          expect(finalRes.status).toBe(404);
        }
      } else {
        expect(res.status).toBe(404);
      }
    });
  });

  describe("API routes not affected by locale", () => {
    it("/api/credits/balance is reachable (not redirected)", async () => {
      const res = await fetchNoRedirect(`${BASE_URL}/api/credits/balance`);
      // Should return 200 or 401 (auth required), never a locale redirect
      expect(res.status).not.toBeGreaterThanOrEqual(300);
      expect([200, 401, 403]).toContain(res.status);
    });
  });
});

/**
 * Checkout API 유닛 테스트 — Polar SDK를 모킹하여 체크아웃 로직 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ── 환경변수 설정 ────────────────────────────────────────
vi.stubEnv("POLAR_ACCESS_TOKEN", "test_token");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
vi.stubEnv("POLAR_PRODUCT_BASIC", "prod_basic");
vi.stubEnv("POLAR_PRODUCT_PRO", "prod_pro");
vi.stubEnv("POLAR_PRODUCT_PREMIUM", "prod_premium");
vi.stubEnv("POLAR_PRODUCT_CREDIT_700", "prod_credit_700");
vi.stubEnv("POLAR_PRODUCT_CREDIT_1500", "prod_credit_1500");
vi.stubEnv("POLAR_PRODUCT_CREDIT_2400", "prod_credit_2400");
vi.stubEnv("POLAR_PRODUCT_CREDIT_3300", "prod_credit_3300");
vi.stubEnv("POLAR_PRODUCT_CREDIT_5100", "prod_credit_5100");

// ── Polar SDK 모킹 ──────────────────────────────────────
const mockCheckoutCreate = vi.fn();

vi.mock("@/lib/polar", () => ({
  createPolarClient: () => ({
    checkouts: { create: mockCheckoutCreate },
  }),
}));

// ── withAuth를 passthrough로 모킹 (에러도 catch) ─────
vi.mock("@/lib/supabase/middleware", () => ({
  withAuth: (handler: Function) => {
    return async (request: Request) => {
      try {
        return await handler(request, {
          supabase: {},
          user: { id: "user_123", email: "test@test.com" },
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const e = err as { statusCode: number; code: string; message: string };
          return NextResponse.json(
            { success: false, error: { code: e.code, message: e.message } },
            { status: e.statusCode }
          );
        }
        return NextResponse.json(
          { success: false, error: { code: "INTERNAL_ERROR", message: "서버 오류" } },
          { status: 500 }
        );
      }
    };
  },
}));

describe("Checkout API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckoutCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/test-session",
      id: "checkout_123",
    });
  });

  function createRequest(body: Record<string, unknown>) {
    return new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("구독 체크아웃 세션을 생성한다", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "subscription", planId: "basic" });
    const response = await POST(req as never);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.checkoutUrl).toBe("https://checkout.polar.sh/test-session");
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ["prod_basic"],
        customerEmail: "test@test.com",
        externalCustomerId: "user_123",
      })
    );
  });

  it("크레딧 팩 체크아웃 세션을 생성한다", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "credit_pack", creditPackCredits: "1500" });
    const response = await POST(req as never);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({ products: ["prod_credit_1500"] })
    );
  });

  it("잘못된 productType을 거부한다 (422)", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "invalid" });
    const response = await POST(req as never);

    expect(response.status).toBe(400);
  });

  it("구독에 planId가 없으면 거부한다 (422)", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "subscription" });
    const response = await POST(req as never);

    expect(response.status).toBe(400);
  });

  it("크레딧 팩에 잘못된 수량을 거부한다 (422)", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "credit_pack", creditPackCredits: "999" });
    const response = await POST(req as never);

    expect(response.status).toBe(400);
  });

  it("Polar API 실패 시 500을 반환한다", async () => {
    mockCheckoutCreate.mockRejectedValue(new Error("Polar API error"));
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    const req = createRequest({ productType: "subscription", planId: "pro" });
    const response = await POST(req as never);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("CHECKOUT_FAILED");
  });

  it("모든 구독 플랜 상품 ID가 올바르다", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    for (const [planId, expected] of [
      ["basic", "prod_basic"],
      ["pro", "prod_pro"],
      ["premium", "prod_premium"],
    ]) {
      mockCheckoutCreate.mockClear();
      const req = createRequest({ productType: "subscription", planId });
      await POST(req as never);
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({ products: [expected] })
      );
    }
  });

  it("모든 크레딧 팩 상품 ID가 올바르다", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/checkout/route");

    for (const [credits, expected] of [
      ["700", "prod_credit_700"],
      ["1500", "prod_credit_1500"],
      ["2400", "prod_credit_2400"],
      ["3300", "prod_credit_3300"],
      ["5100", "prod_credit_5100"],
    ]) {
      mockCheckoutCreate.mockClear();
      const req = createRequest({ productType: "credit_pack", creditPackCredits: credits });
      await POST(req as never);
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({ products: [expected] })
      );
    }
  });
});

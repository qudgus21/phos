/**
 * Webhook API 유닛 테스트 — 서명 검증 및 이벤트 라우팅 로직 검증
 *
 * Supabase 의존성이 깊은 핸들러 로직은 db-rpc-integration.test.ts에서 검증.
 * 여기서는 HTTP 레벨 검증만 수행.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── 환경변수 직접 설정 ───────────────────────────────────
process.env.POLAR_WEBHOOK_SECRET = "test_webhook_secret";
process.env.POLAR_PRODUCT_BASIC = "prod_basic";
process.env.POLAR_PRODUCT_PRO = "prod_pro";
process.env.POLAR_PRODUCT_PREMIUM = "prod_premium";
process.env.POLAR_PRODUCT_CREDIT_700 = "prod_credit_700";
process.env.POLAR_PRODUCT_CREDIT_1500 = "prod_credit_1500";
process.env.POLAR_PRODUCT_CREDIT_2400 = "prod_credit_2400";
process.env.POLAR_PRODUCT_CREDIT_3300 = "prod_credit_3300";
process.env.POLAR_PRODUCT_CREDIT_5100 = "prod_credit_5100";

// ── 모킹 ─────────────────────────────────────────────────
const mockValidateEvent = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ data: { success: true }, error: null });

// Supabase admin mock — 체이닝 가능한 빌더 패턴
function createChainMock(finalResult: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const terminalMethods = ["single", "limit", "maybeSingle"];

  for (const method of ["select", "insert", "update", "delete", "eq", "like", "order", ...terminalMethods]) {
    if (terminalMethods.includes(method)) {
      chain[method] = vi.fn().mockResolvedValue(finalResult);
    } else {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
  }
  return chain;
}

let webhookEventsSelectResult: unknown = { data: null, error: null };
let ordersSelectResult: unknown = { data: null, error: null };

vi.mock("@polar-sh/sdk/webhooks", () => ({
  validateEvent: (...args: unknown[]) => mockValidateEvent(...args),
  WebhookVerificationError: class extends Error {
    constructor(msg: string) { super(msg); this.name = "WebhookVerificationError"; }
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "webhook_events") return createChainMock(webhookEventsSelectResult);
      if (table === "orders") return createChainMock(ordersSelectResult);
      return createChainMock();
    },
    rpc: mockRpc,
  }),
}));

function createWebhookRequest(body: unknown, webhookId = "wh_test_001") {
  const headers = new Headers({
    "content-type": "application/json",
    "webhook-id": webhookId,
    "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
    "webhook-signature": "v1,test_sig",
  });
  return {
    text: () => Promise.resolve(JSON.stringify(body)),
    headers,
  } as unknown as import("next/server").NextRequest;
}

describe("Webhook API", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    webhookEventsSelectResult = { data: null, error: null }; // 아직 미처리
    ordersSelectResult = { data: null, error: null };
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    vi.resetModules();
    process.env.POLAR_WEBHOOK_SECRET = "test_webhook_secret";
    const mod = await import("@/app/api/webhook/polar/route");
    POST = mod.POST;
  });

  describe("서명 검증", () => {
    it("유효한 서명이면 200으로 처리한다", async () => {
      mockValidateEvent.mockReturnValue({ type: "checkout.created", data: {} });
      const req = createWebhookRequest({});
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("서명 실패 시 403을 반환한다", async () => {
      const { WebhookVerificationError } = await import("@polar-sh/sdk/webhooks");
      mockValidateEvent.mockImplementation(() => { throw new WebhookVerificationError("bad"); });
      const req = createWebhookRequest({});
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("POLAR_WEBHOOK_SECRET 미설정 시 500을 반환한다", async () => {
      process.env.POLAR_WEBHOOK_SECRET = "";
      vi.resetModules();
      const mod = await import("@/app/api/webhook/polar/route");
      const req = createWebhookRequest({});
      const res = await mod.POST(req as never);
      expect(res.status).toBe(500);
    });
  });

  describe("멱등성", () => {
    it("이미 처리된 이벤트는 duplicate 응답한다", async () => {
      mockValidateEvent.mockReturnValue({ type: "order.paid", data: {} });
      webhookEventsSelectResult = { data: { id: "wh_dup" }, error: null };

      const req = createWebhookRequest({}, "wh_dup");
      const res = await POST(req);
      const json = await res.json();
      expect(json.duplicate).toBe(true);
    });

    it("새 이벤트는 정상 처리 후 기록한다", async () => {
      mockValidateEvent.mockReturnValue({ type: "checkout.created", data: {} });
      webhookEventsSelectResult = { data: null, error: null };

      const req = createWebhookRequest({}, "wh_new");
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.duplicate).toBeUndefined();
    });
  });

  describe("order.paid → 구독", () => {
    it("구독 상품이면 process_subscription_activation을 호출한다", async () => {
      mockValidateEvent.mockReturnValue({
        type: "order.paid",
        data: {
          id: "order_001",
          customer: { id: "polar_cus", externalId: "user_123" },
          product: { id: "prod_basic" },
          subscription: { id: "sub_001", currentPeriodStart: new Date(), currentPeriodEnd: new Date() },
          totalAmount: 900,
        },
      });

      const req = createWebhookRequest({}, "wh_order_sub");
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        "process_subscription_activation",
        expect.objectContaining({
          p_user_id: "user_123",
          p_plan_id: "basic",
          p_credits: 2000,
        })
      );
    });
  });

  describe("order.paid → 크레딧 팩", () => {
    it("크레딧 팩이면 process_credit_purchase를 호출한다", async () => {
      mockValidateEvent.mockReturnValue({
        type: "order.paid",
        data: {
          id: "order_c01",
          customer: { id: "polar_cus", externalId: "user_123" },
          product: { id: "prod_credit_700" },
          subscription: null,
          totalAmount: 500,
        },
      });

      const req = createWebhookRequest({}, "wh_order_credit");
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        "process_credit_purchase",
        expect.objectContaining({
          p_user_id: "user_123",
          p_credits: 700,
        })
      );
    });
  });

  describe("subscription.revoked", () => {
    it("process_subscription_revoke RPC를 호출한다", async () => {
      mockValidateEvent.mockReturnValue({
        type: "subscription.revoked",
        data: { customer: { id: "polar_cus", externalId: "user_123" } },
      });

      const req = createWebhookRequest({}, "wh_revoke");
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        "process_subscription_revoke",
        expect.objectContaining({ p_user_id: "user_123" })
      );
    });
  });

  describe("에러 처리", () => {
    it("RPC 실패 시 500 반환 (Polar 재시도 유도)", async () => {
      mockValidateEvent.mockReturnValue({
        type: "subscription.revoked",
        data: { customer: { id: "polar_cus", externalId: "user_123" } },
      });
      mockRpc.mockResolvedValue({ data: null, error: { message: "DB fail", code: "500" } });

      const req = createWebhookRequest({}, "wh_err");
      const res = await POST(req);
      expect(res.status).toBe(500);
    });

    it("알 수 없는 이벤트 타입은 200으로 응답한다", async () => {
      mockValidateEvent.mockReturnValue({ type: "benefit.created", data: {} });
      const req = createWebhookRequest({}, "wh_unknown");
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });
});

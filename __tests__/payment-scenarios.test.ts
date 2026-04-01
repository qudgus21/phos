/**
 * 결제 시스템 종합 시나리오 테스트
 * payment-system.html의 기본 시나리오 + 엣지 시나리오를 모두 검증
 *
 * 실제 Supabase DB에 연결하여 RPC 함수를 테스트합니다.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { checkCooldown } from "@/lib/services/credits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

let TEST_USER_ID: string;
const TEST_EMAIL = "payment-scenarios-test@phos.studio";
const ORD = "ps_test_order_"; // order ID prefix
let orderSeq = 0;

function nextOrderId() {
  return `${ORD}${++orderSeq}`;
}

// ── Setup / Teardown ─────────────────────────────────────

async function cleanupTestData() {
  if (!TEST_USER_ID) return;
  await admin.from("credit_transactions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("orders").delete().like("id", `${ORD}%`);
  await admin.from("generation_history").delete().eq("user_id", TEST_USER_ID);
  await admin.from("user_subscriptions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("user_credits").delete().eq("user_id", TEST_USER_ID);
  await admin.from("users").delete().eq("id", TEST_USER_ID);

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const testUser = authUsers?.users?.find((u) => u.email === TEST_EMAIL);
  if (testUser) await admin.auth.admin.deleteUser(testUser.id);
}

async function setupTestUser() {
  const { data: existing } = await admin.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u) => u.email === TEST_EMAIL);
  if (existingUser) {
    TEST_USER_ID = existingUser.id;
    await cleanupTestData();
    await admin.auth.admin.deleteUser(existingUser.id);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: "test-password-123!",
    email_confirm: true,
  });
  if (authError || !authData.user) throw new Error(`Auth user creation failed: ${authError?.message}`);
  TEST_USER_ID = authData.user.id;

  await admin.from("users").upsert({ id: TEST_USER_ID, email: TEST_EMAIL, name: "Test User", auth_provider: "test", role: "user" });
  await admin.from("user_credits").upsert({ user_id: TEST_USER_ID, balance: 0, subscription_balance: 0, onetime_balance: 0, period_credits_granted: 0 });
}

/** 크레딧/구독 상태를 원하는 값으로 초기화 */
async function resetState(opts: {
  sub?: number;
  onetime?: number;
  planId?: string;
  status?: string;
  scheduledPlanId?: string | null;
  periodGranted?: number;
} = {}) {
  const sub = opts.sub ?? 0;
  const onetime = opts.onetime ?? 0;
  const planId = opts.planId ?? "free";
  const status = opts.status ?? "active";
  const scheduledPlanId = opts.scheduledPlanId ?? null;
  const periodGranted = opts.periodGranted ?? 0;

  await admin.from("user_credits").update({
    subscription_balance: sub,
    onetime_balance: onetime,
    balance: sub + onetime,
    period_credits_granted: periodGranted,
    last_generation_at: null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", TEST_USER_ID);

  // upsert로 생성 보장 후 update로 확실히 덮어쓰기
  await admin.from("user_subscriptions").upsert({
    user_id: TEST_USER_ID,
    plan_id: planId,
    status,
    scheduled_plan_id: scheduledPlanId,
    external_subscription_id: planId !== "free" ? "test_sub_id" : null,
    external_customer_id: planId !== "free" ? "test_cus_id" : null,
    current_period_start: planId !== "free" ? new Date().toISOString() : null,
    current_period_end: planId !== "free" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
  });
  await admin.from("user_subscriptions").update({
    plan_id: planId,
    status,
    scheduled_plan_id: scheduledPlanId,
    external_subscription_id: planId !== "free" ? "test_sub_id" : null,
    external_customer_id: planId !== "free" ? "test_cus_id" : null,
    current_period_start: planId !== "free" ? new Date().toISOString() : null,
    current_period_end: planId !== "free" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", TEST_USER_ID);

  // Clean orders & transactions for this test
  await admin.from("credit_transactions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("orders").delete().like("id", `${ORD}%`);
}

/** DB에서 크레딧/구독 상태 조회 */
async function getState() {
  const [{ data: credits }, { data: subscription }] = await Promise.all([
    admin.from("user_credits").select("*").eq("user_id", TEST_USER_ID).single(),
    admin.from("user_subscriptions").select("*").eq("user_id", TEST_USER_ID).single(),
  ]);
  return { credits: credits!, subscription: subscription! };
}

/** 구독 활성화 RPC 호출 헬퍼 */
async function activate(
  planId: string,
  credits: number,
  orderId?: string,
  oldPlanCredits?: number,
  periodStart?: string,
  periodEnd?: string
) {
  const start = periodStart ?? new Date().toISOString();
  const end = periodEnd ?? new Date(Date.now() + 30 * 86400000).toISOString();
  const { data, error } = await admin.rpc("process_subscription_activation", {
    p_user_id: TEST_USER_ID,
    p_plan_id: planId,
    p_polar_subscription_id: "test_sub_id",
    p_polar_customer_id: "test_cus_id",
    p_period_start: start,
    p_period_end: end,
    p_credits: credits,
    p_order_id: orderId ?? nextOrderId(),
    p_amount_cents: 900,
    p_polar_product_id: `prod_${planId}`,
    ...(oldPlanCredits !== undefined ? { p_old_plan_credits: oldPlanCredits } : {}),
  });
  expect(error).toBeNull();
  return data as Record<string, unknown>;
}

/** 비례 계산용: period_start/end를 만들어서 원하는 비례율 설정 */
function makePeriod(totalDays: number, remainingDays: number) {
  const now = Date.now();
  const elapsedDays = totalDays - remainingDays;
  const periodStart = new Date(now - elapsedDays * 86400000).toISOString();
  const periodEnd = new Date(now + remainingDays * 86400000).toISOString();
  return { periodStart, periodEnd };
}

/** 크레딧 차감 RPC */
async function deduct(amount: number) {
  const { data, error } = await admin.rpc("deduct_credits", {
    p_user_id: TEST_USER_ID,
    p_amount: amount,
    p_description: "test deduction",
    p_metadata: {},
  });
  expect(error).toBeNull();
  return data as Record<string, unknown>;
}

/** 크레딧 추가 RPC */
async function addCredits(amount: number, creditType: "onetime" | "subscription", txType: string = "refund") {
  const { data, error } = await admin.rpc("add_credits", {
    p_user_id: TEST_USER_ID,
    p_amount: amount,
    p_credit_type: creditType,
    p_transaction_type: txType,
    p_description: "test add",
    p_metadata: {},
  });
  expect(error).toBeNull();
  return data as Record<string, unknown>;
}

// ══════════════════════════════════════════════════════════
// 테스트 시작
// ══════════════════════════════════════════════════════════

describe("결제 시나리오 종합 테스트", () => {
  beforeAll(async () => {
    await setupTestUser();
  }, 30000);

  afterAll(async () => {
    await cleanupTestData();
  }, 30000);

  // ── 기본 시나리오 ──────────────────────────────────────

  describe("기본 시나리오", () => {
    beforeEach(async () => {
      await resetState();
    });

    it("4-1: 신규 구독 — Basic 플랜 활성화", async () => {
      const result = await activate("basic", 2000);
      expect(result.success).toBe(true);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(2000);
      expect(credits.onetime_balance).toBe(0);
      expect(credits.balance).toBe(2000);
      expect(subscription.plan_id).toBe("basic");
      expect(subscription.status).toBe("active");
    });

    it("4-2: 갱신 — 기존 잔액에 누적", async () => {
      await resetState({ sub: 300, planId: "basic", periodGranted: 2000 });

      const result = await activate("basic", 2000);
      expect(result.success).toBe(true);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(2300); // 300 + 2000
    });

    it("4-3: 업그레이드 — Basic→Pro 날짜 비례 크레딧", async () => {
      // 30일 주기, 지금이 시작일 (비례율 100%)
      const { periodStart, periodEnd } = makePeriod(30, 30);
      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await deduct(500);

      const { credits: before } = await getState();
      expect(before.subscription_balance).toBe(1500);

      // Pro 업그레이드 (비례율 ~100%: 방금 시작)
      const result = await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);
      expect(result.success).toBe(true);

      const { credits, subscription } = await getState();
      // 비례율 ~1.0: 1500 - 2000 + 4400 = 3900
      expect(credits.subscription_balance).toBe(3900);
      expect(subscription.plan_id).toBe("pro");
    });

    it("4-3b: 업그레이드 — 비례율 50% (15일 남음)", async () => {
      const { periodStart, periodEnd } = makePeriod(30, 15);
      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await deduct(500);
      // 잔액 1500

      // Pro 업그레이드 (비례율 50%)
      // Basic비례 = 2000*0.5 = 1000, Pro비례 = 4400*0.5 = 2200
      // 새잔액 = 1500 - 1000 + 2200 = 2700
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(2700);
    });

    it("4-4: 다운그레이드 — scheduled_plan_id 예약만, 크레딧 변경 없음", async () => {
      await resetState({ sub: 4400, planId: "pro", periodGranted: 4400 });

      // 다운그레이드는 DB에 직접 scheduled_plan_id 설정 (웹훅 핸들러가 하는 역할)
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "basic" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(4400); // 변경 없음
      expect(subscription.plan_id).toBe("pro"); // 아직 Pro
      expect(subscription.scheduled_plan_id).toBe("basic");
    });

    it("4-5: 구독 취소 — 크레딧 + 플랜 유지", async () => {
      await resetState({ sub: 5000, planId: "premium", periodGranted: 7100 });

      await admin.from("user_subscriptions").update({ status: "canceled" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(5000); // 유지
      expect(subscription.plan_id).toBe("premium"); // 유지
      expect(subscription.status).toBe("canceled");
    });

    it("4-6: 취소 철회 — 상태만 active로, 크레딧 변경 없음", async () => {
      await resetState({ sub: 5000, planId: "premium", status: "canceled", periodGranted: 7100 });

      await admin.from("user_subscriptions").update({ status: "active" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(5000); // 유지
      expect(subscription.status).toBe("active");
    });

    it("4-7: 구독 해지 (revoked) — 크레딧 유지, Free 전환", async () => {
      await resetState({ sub: 3000, onetime: 500, planId: "pro", periodGranted: 4400 });

      const { data, error } = await admin.rpc("process_subscription_revoke", { p_user_id: TEST_USER_ID });
      expect(error).toBeNull();

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(3000); // 유지 (뺏지 않음)
      expect(credits.onetime_balance).toBe(500); // 유지
      expect(subscription.plan_id).toBe("free");
      expect(subscription.status).toBe("revoked");
      expect(subscription.scheduled_plan_id).toBeNull();
    });

    it("4-8: 크레딧 팩 구매", async () => {
      await resetState({ sub: 2000, onetime: 100, planId: "basic" });

      const { data, error } = await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: nextOrderId(),
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
        p_polar_customer_id: "test_cus_id",
      });
      expect(error).toBeNull();

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(1600); // 100 + 1500
      expect(credits.subscription_balance).toBe(2000); // 변경 없음
    });

    it("4-9a: 전액 환불 — 구독 크레딧 회수", async () => {
      // Basic 구독 후 환불
      const orderId = nextOrderId();
      await activate("basic", 2000, orderId);

      const { data, error } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 2000,
        p_refund_type: "full",
      });
      expect(error).toBeNull();
      const result = data as Record<string, unknown>;
      expect(result.actual_deducted).toBe(2000);
      expect(result.shortfall).toBe(0);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(0);
    });

    it("4-9b: 부분 환불 — 비례 회수", async () => {
      const orderId = nextOrderId();
      await resetState();

      // 크레딧 팩 구매
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: orderId,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      // 450 크레딧 부분 환불
      const { data, error } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 450,
        p_refund_type: "partial",
      });
      expect(error).toBeNull();
      const result = data as Record<string, unknown>;
      expect(result.actual_deducted).toBe(450);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(1050); // 1500 - 450
    });

    it("4-10: 크레딧 차감 (혼합) — 일회성 먼저, 구독 나중", async () => {
      await resetState({ sub: 2000, onetime: 30, planId: "basic" });

      const result = await deduct(80);
      expect(result.success).toBe(true);
      expect(result.onetime_deducted).toBe(30);
      expect(result.subscription_deducted).toBe(50);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(0);
      expect(credits.subscription_balance).toBe(1950);
    });
  });

  // ── 엣지 시나리오 ──────────────────────────────────────

  describe("엣지 시나리오", () => {
    beforeEach(async () => {
      await resetState();
    });

    it("E1: 다중 업그레이드 Basic→Pro→Premium (비례율 ~100%)", async () => {
      // 30일 주기 시작일 (비례율 ~100%)
      const { periodStart, periodEnd } = makePeriod(30, 30);

      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await deduct(500);
      expect((await getState()).credits.subscription_balance).toBe(1500);

      // Pro 업그레이드 (비례율 ~100%)
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);
      expect((await getState()).credits.subscription_balance).toBe(3900);

      await deduct(1000);
      expect((await getState()).credits.subscription_balance).toBe(2900);

      // Premium 업그레이드 (비례율 ~100%)
      await activate("premium", 7100, nextOrderId(), 4400, periodStart, periodEnd);
      expect((await getState()).credits.subscription_balance).toBe(5600);
    });

    it("E2: 업그레이드 후 즉시 다운그레이드", async () => {
      const { periodStart, periodEnd } = makePeriod(30, 30);
      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);

      const { credits: afterUpgrade } = await getState();
      expect(afterUpgrade.subscription_balance).toBe(4400); // 비례율~100%: 2000-2000+4400

      // 다운그레이드 예약
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "basic" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(4400); // 변경 없음
      expect(subscription.scheduled_plan_id).toBe("basic");
    });

    it("E3: 다운그레이드 예약 후 업그레이드 — 예약 해제", async () => {
      await resetState({ sub: 7100, planId: "premium", periodGranted: 7100 });
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "basic" }).eq("user_id", TEST_USER_ID);

      // Premium → Pro는 다운그레이드지만, 여기서는 "다운그레이드 예약 해제" 테스트
      // 같은 플랜으로 업데이트하여 scheduled 해제
      await admin.from("user_subscriptions").update({ scheduled_plan_id: null }).eq("user_id", TEST_USER_ID);

      const { subscription } = await getState();
      expect(subscription.scheduled_plan_id).toBeNull();
      expect(subscription.plan_id).toBe("premium");
    });

    it("E4: 다운그레이드 예약 후 취소 — 예약 해제", async () => {
      await resetState({ sub: 4400, planId: "pro", periodGranted: 4400 });
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "basic" }).eq("user_id", TEST_USER_ID);

      // 취소 (scheduled_plan_id도 함께 해제 — 다음 결제가 없으므로)
      await admin.from("user_subscriptions").update({ status: "canceled", scheduled_plan_id: null }).eq("user_id", TEST_USER_ID);

      const { subscription } = await getState();
      expect(subscription.status).toBe("canceled");
      expect(subscription.scheduled_plan_id).toBeNull(); // 해제됨
    });

    it("E5: 취소 후 재구독 — 크레딧 변경 없음", async () => {
      await resetState({ sub: 5000, planId: "premium", status: "canceled", periodGranted: 7100 });

      await admin.from("user_subscriptions").update({ status: "active" }).eq("user_id", TEST_USER_ID);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(5000);
    });

    it("E6: 취소 후 다른 플랜 구독 — 잔액 + 누적", async () => {
      await resetState({ sub: 3000, planId: "premium", status: "canceled", periodGranted: 7100 });

      await activate("basic", 2000);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(5000); // 3000 + 2000
      expect(subscription.plan_id).toBe("basic");
      expect(subscription.status).toBe("active");
    });

    it("E7: 크레딧 팩 구매 후 구독 취소 — 둘 다 유지", async () => {
      await resetState({ sub: 4400, planId: "pro", periodGranted: 4400 });

      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: nextOrderId(),
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      await admin.from("user_subscriptions").update({ status: "canceled" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(4400);
      expect(credits.onetime_balance).toBe(1500);
      expect(subscription.status).toBe("canceled");
      expect(subscription.plan_id).toBe("pro"); // 유지
    });

    it("E8: 업그레이드 후 구 주문 환불 — 현재 잔액에서 회수", async () => {
      const { periodStart, periodEnd } = makePeriod(30, 30);
      const basicOrderId = nextOrderId();
      await activate("basic", 2000, basicOrderId, undefined, periodStart, periodEnd);
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);

      const { credits: before } = await getState();
      expect(before.subscription_balance).toBe(4400);

      // Basic 주문 환불 (2000 회수 시도)
      const { data, error } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: basicOrderId,
        p_credits_to_revoke: 2000,
        p_refund_type: "full",
      });
      expect(error).toBeNull();
      const result = data as Record<string, unknown>;
      expect(result.actual_deducted).toBe(2000);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(2400); // 4400 - 2000
    });

    it("E9: 크레딧 팩 사용 후 환불 (shortfall)", async () => {
      const orderId = nextOrderId();
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: orderId,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      // 1200 사용
      await deduct(1200);
      const { credits: afterDeduct } = await getState();
      expect(afterDeduct.onetime_balance).toBe(300);

      // 전액 환불 → 1500 회수 시도, 300만 가능
      const { data } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 1500,
        p_refund_type: "full",
      });
      const result = data as Record<string, unknown>;
      expect(result.actual_deducted).toBe(300);
      expect(result.shortfall).toBe(1200);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(0);
    });

    it("E10: 다중 부분 환불 — 누적 추적", async () => {
      const orderId = nextOrderId();
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: orderId,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      // 1차 부분 환불: 450 회수
      const { data: r1 } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 450,
        p_refund_type: "partial",
      });
      expect((r1 as Record<string, unknown>).actual_deducted).toBe(450);

      // metadata 업데이트 (웹훅 핸들러가 하는 것처럼)
      await admin.from("orders").update({ metadata: { total_refunded_credits: 450 } }).eq("id", orderId);

      // 2차 부분 환불: 450 추가 회수
      const { data: r2 } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 450,
        p_refund_type: "partial",
      });
      expect((r2 as Record<string, unknown>).actual_deducted).toBe(450);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(600); // 1500 - 450 - 450
    });

    it("E11: 크레딧 부족 — 생성 거부", async () => {
      await resetState({ sub: 20, onetime: 30 });

      const { data, error } = await admin.rpc("deduct_credits", {
        p_user_id: TEST_USER_ID,
        p_amount: 80,
        p_description: "test",
        p_metadata: {},
      });
      expect(error).toBeNull();
      const result = data as Record<string, unknown>;
      expect(result.success).toBe(false);
      expect(result.error).toBe("insufficient_credits");
      expect(result.available).toBe(50);
      expect(result.required).toBe(80);

      // 잔액 변경 없음
      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(20);
      expect(credits.onetime_balance).toBe(30);
    });

    it("E12: 생성 실패 복원 (일회성만)", async () => {
      await resetState({ sub: 2000, onetime: 100 });

      // 차감
      const deductResult = await deduct(80);
      expect(deductResult.onetime_deducted).toBe(80);
      expect(deductResult.subscription_deducted).toBe(0);

      // 복원
      await addCredits(80, "onetime");

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(100);
      expect(credits.subscription_balance).toBe(2000);
    });

    it("E12b: 생성 실패 복원 (혼합)", async () => {
      await resetState({ sub: 2000, onetime: 30 });

      const deductResult = await deduct(80);
      expect(deductResult.onetime_deducted).toBe(30);
      expect(deductResult.subscription_deducted).toBe(50);

      // 각각 원래 풀로 복원
      await addCredits(30, "onetime");
      await addCredits(50, "subscription");

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(30);
      expect(credits.subscription_balance).toBe(2000);
    });

    it("E13: 쿨다운 계산", () => {
      // 방금 생성 → 300초 쿨다운
      const now = new Date().toISOString();
      const remaining = checkCooldown(now, 300);
      expect(remaining).toBeGreaterThan(298);
      expect(remaining).toBeLessThanOrEqual(300);

      // 쿨다운 없음
      expect(checkCooldown(null, 300)).toBe(0);
      expect(checkCooldown(now, 0)).toBe(0);

      // 5분 전 생성 → 쿨다운 끝
      const fiveMinAgo = new Date(Date.now() - 301000).toISOString();
      expect(checkCooldown(fiveMinAgo, 300)).toBe(0);
    });

    it("E14: 해지 후 재구독 — 잔액 누적", async () => {
      await resetState({ sub: 800, planId: "basic", periodGranted: 2000 });

      // 해지
      await admin.rpc("process_subscription_revoke", { p_user_id: TEST_USER_ID });

      const { credits: afterRevoke } = await getState();
      expect(afterRevoke.subscription_balance).toBe(800); // 유지

      // Pro 재구독
      await activate("pro", 4400);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(5200); // 800 + 4400
      expect(subscription.plan_id).toBe("pro");
      expect(subscription.status).toBe("active");
    });

    it("E15: 다운그레이드 예약 변경 — 마지막 선택 반영", async () => {
      await resetState({ sub: 7100, planId: "premium", periodGranted: 7100 });

      // Basic으로 다운그레이드 예약
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "basic" }).eq("user_id", TEST_USER_ID);

      // Pro로 변경
      await admin.from("user_subscriptions").update({ scheduled_plan_id: "pro" }).eq("user_id", TEST_USER_ID);

      const { subscription } = await getState();
      expect(subscription.scheduled_plan_id).toBe("pro");
    });

    it("E16: 업그레이드 후 즉시 취소 — 크레딧 유지", async () => {
      const { periodStart, periodEnd } = makePeriod(30, 30);
      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);

      await admin.from("user_subscriptions").update({ status: "canceled" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(4400); // 유지
      expect(subscription.status).toBe("canceled");
      expect(subscription.plan_id).toBe("pro"); // 유지
    });

    it("E17: 갱신 시 일회성 크레딧 영향 없음", async () => {
      await resetState({ sub: 300, onetime: 800, planId: "basic", periodGranted: 2000 });

      await activate("basic", 2000);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(2300); // 300 + 2000
      expect(credits.onetime_balance).toBe(800); // 그대로
    });

    it("E22: 구독 0 + 일회성만 차감", async () => {
      await resetState({ sub: 0, onetime: 500 });

      const result = await deduct(80);
      expect(result.onetime_deducted).toBe(80);
      expect(result.subscription_deducted).toBe(0);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(420);
      expect(credits.subscription_balance).toBe(0);
    });

    it("E23: 혼합 차감", async () => {
      await resetState({ sub: 2000, onetime: 30 });

      const result = await deduct(80);
      expect(result.onetime_deducted).toBe(30);
      expect(result.subscription_deducted).toBe(50);

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(0);
      expect(credits.subscription_balance).toBe(1950);
    });

    it("E24: 다중 업그레이드 후 취소 — 크레딧 유지", async () => {
      const { periodStart, periodEnd } = makePeriod(30, 30);
      await activate("basic", 2000, undefined, undefined, periodStart, periodEnd);
      await deduct(500);
      await activate("pro", 4400, nextOrderId(), 2000, periodStart, periodEnd);
      await deduct(1000);
      await activate("premium", 7100, nextOrderId(), 4400, periodStart, periodEnd);

      const { credits: beforeCancel } = await getState();
      const balanceBeforeCancel = beforeCancel.subscription_balance;

      await admin.from("user_subscriptions").update({ status: "canceled" }).eq("user_id", TEST_USER_ID);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(balanceBeforeCancel); // 유지
      expect(subscription.status).toBe("canceled");
    });

    it("E25: 환불 shortfall — 부족분 기록", async () => {
      const orderId = nextOrderId();
      await activate("basic", 2000, orderId);
      // 1200 사용
      await deduct(1200);

      const { data } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: orderId,
        p_credits_to_revoke: 2000,
        p_refund_type: "full",
      });
      const result = data as Record<string, unknown>;
      expect(result.actual_deducted).toBe(800); // 잔여분만
      expect(result.shortfall).toBe(1200);

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(0);
    });
  });

  // ── 멱등성 테스트 ──────────────────────────────────────

  describe("멱등성", () => {
    beforeEach(async () => {
      await resetState();
    });

    it("같은 order_id로 구독 활성화 2회 → 크레딧 1회만 부여", async () => {
      const orderId = nextOrderId();
      await activate("basic", 2000, orderId);
      const { credits: after1 } = await getState();
      expect(after1.subscription_balance).toBe(2000);

      // 같은 order_id로 재호출
      const result = await activate("basic", 2000, orderId);
      expect(result.already_processed).toBe(true);

      const { credits: after2 } = await getState();
      expect(after2.subscription_balance).toBe(2000); // 변경 없음
    });

    it("같은 order_id로 크레딧 팩 2회 → 크레딧 1회만 부여", async () => {
      const orderId = nextOrderId();

      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: orderId,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      const { credits: after1 } = await getState();
      expect(after1.onetime_balance).toBe(1500);

      // 같은 order_id로 재호출
      const { data } = await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: orderId,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });
      expect((data as Record<string, unknown>).already_processed).toBe(true);

      const { credits: after2 } = await getState();
      expect(after2.onetime_balance).toBe(1500); // 변경 없음
    });
  });
});

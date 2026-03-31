/**
 * Supabase RPC 통합 테스트 — 실제 DB에서 결제 관련 RPC를 검증
 *
 * 주의: 이 테스트는 실제 Supabase DB에 연결하여 실행됩니다.
 * 테스트 유저를 생성하고 정리합니다.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables for integration tests");
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

// 테스트 전용 유저 — auth.users를 통해 생성
let TEST_USER_ID: string;
const TEST_ORDER_PREFIX = "test_order_";
const TEST_EMAIL = "polar-integration-test@phos.studio";

async function cleanupTestData() {
  if (!TEST_USER_ID) return;
  // 역순 삭제 (FK 의존성)
  await admin.from("credit_transactions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("orders").delete().like("id", `${TEST_ORDER_PREFIX}%`);
  await admin.from("generation_history").delete().eq("user_id", TEST_USER_ID);
  await admin.from("user_subscriptions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("user_credits").delete().eq("user_id", TEST_USER_ID);
  await admin.from("users").delete().eq("id", TEST_USER_ID);
  await admin.from("webhook_events").delete().like("id", "test_%");

  // auth.users 정리
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const testUser = authUsers?.users?.find((u) => u.email === TEST_EMAIL);
  if (testUser) {
    await admin.auth.admin.deleteUser(testUser.id);
  }
}

async function setupTestUser() {
  // 1. 기존 테스트 유저 정리
  const { data: existing } = await admin.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u) => u.email === TEST_EMAIL);
  if (existingUser) {
    // 먼저 관련 데이터 삭제
    TEST_USER_ID = existingUser.id;
    await cleanupTestData();
    await admin.auth.admin.deleteUser(existingUser.id);
  }

  // 2. auth.users에 유저 생성
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: "test-password-123!",
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test auth user: ${authError?.message}`);
  }

  TEST_USER_ID = authData.user.id;

  // 3. public.users는 트리거가 자동 생성하지 않으면 수동 생성
  await admin.from("users").upsert({
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: "Test User",
    auth_provider: "test",
    role: "user",
  });

  // 4. user_credits 초기화
  await admin.from("user_credits").upsert({
    user_id: TEST_USER_ID,
    balance: 120,
    subscription_balance: 0,
    onetime_balance: 120,
  });
}

describe("DB RPC 통합 테스트", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await setupTestUser();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─────────────────────────────────────────────────────
  // 1. 구독 활성화
  // ─────────────────────────────────────────────────────
  describe("process_subscription_activation", () => {
    it("신규 구독을 활성화하고 크레딧을 부여한다", async () => {
      // 초기 잔액 확인
      const { data: before } = await admin
        .from("user_credits")
        .select("onetime_balance, subscription_balance")
        .eq("user_id", TEST_USER_ID)
        .single();
      const initialOnetime = before?.onetime_balance ?? 0;
      const initialSub = before?.subscription_balance ?? 0;

      const { data, error } = await admin.rpc("process_subscription_activation", {
        p_user_id: TEST_USER_ID,
        p_plan_id: "basic",
        p_polar_subscription_id: "polar_sub_001",
        p_polar_customer_id: "polar_cus_001",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits: 2000,
        p_order_id: `${TEST_ORDER_PREFIX}sub_basic`,
        p_amount_cents: 900,
        p_polar_product_id: "prod_basic",
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, subscription_balance: 2000 });

      // DB 상태 확인
      const { data: credits } = await admin
        .from("user_credits")
        .select("subscription_balance, onetime_balance, balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(credits?.subscription_balance).toBe(2000);
      expect(credits?.onetime_balance).toBe(initialOnetime); // 기존 onetime 유지
      expect(credits?.balance).toBe(2000 + initialOnetime);

      // 구독 상태 확인
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("plan_id, status, external_subscription_id")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(sub?.plan_id).toBe("basic");
      expect(sub?.status).toBe("active");
      expect(sub?.external_subscription_id).toBe("polar_sub_001");

      // polar_customer_id 확인
      const { data: user } = await admin
        .from("users")
        .select("polar_customer_id")
        .eq("id", TEST_USER_ID)
        .single();

      expect(user?.polar_customer_id).toBe("polar_cus_001");

      // orders 확인
      const { data: order } = await admin
        .from("orders")
        .select("*")
        .eq("id", `${TEST_ORDER_PREFIX}sub_basic`)
        .single();

      expect(order?.product_type).toBe("subscription");
      expect(order?.credits_granted).toBe(2000);

      // credit_transactions 확인
      const { data: txns } = await admin
        .from("credit_transactions")
        .select("type, subscription_delta")
        .eq("user_id", TEST_USER_ID)
        .order("created_at", { ascending: false })
        .limit(1);

      expect(txns?.[0]?.type).toBe("subscription_grant");
      expect(txns?.[0]?.subscription_delta).toBe(2000 - initialSub);
    });

    it("플랜 업그레이드 시 크레딧을 리셋한다 (UPSERT)", async () => {
      const { data, error } = await admin.rpc("process_subscription_activation", {
        p_user_id: TEST_USER_ID,
        p_plan_id: "pro",
        p_polar_subscription_id: "polar_sub_002",
        p_polar_customer_id: "polar_cus_001",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits: 4400,
        p_order_id: `${TEST_ORDER_PREFIX}sub_pro`,
        p_amount_cents: 1900,
        p_polar_product_id: "prod_pro",
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, subscription_balance: 4400 });

      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("plan_id")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(sub?.plan_id).toBe("pro");
    });

    it("동일 order_id로 재호출해도 orders 중복 생성되지 않는다 (멱등성)", async () => {
      await admin.rpc("process_subscription_activation", {
        p_user_id: TEST_USER_ID,
        p_plan_id: "pro",
        p_polar_subscription_id: "polar_sub_002",
        p_polar_customer_id: "polar_cus_001",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits: 4400,
        p_order_id: `${TEST_ORDER_PREFIX}sub_pro`,
        p_amount_cents: 1900,
        p_polar_product_id: "prod_pro",
      });

      const { data: orders } = await admin
        .from("orders")
        .select("id")
        .eq("id", `${TEST_ORDER_PREFIX}sub_pro`);

      expect(orders?.length).toBe(1);
    });

    it("존재하지 않는 유저에 대해 실패한다", async () => {
      const { data } = await admin.rpc("process_subscription_activation", {
        p_user_id: "00000000-0000-0000-0000-000000000000",
        p_plan_id: "basic",
        p_polar_subscription_id: "x",
        p_polar_customer_id: "x",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date().toISOString(),
        p_credits: 2000,
      });

      expect(data).toMatchObject({ success: false, error: "user_credits not found" });
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 크레딧 팩 구매
  // ─────────────────────────────────────────────────────
  describe("process_credit_purchase", () => {
    it("onetime 크레딧을 추가한다", async () => {
      const { data: before } = await admin
        .from("user_credits")
        .select("onetime_balance, subscription_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      const { data, error } = await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: `${TEST_ORDER_PREFIX}credit_1500`,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
        p_polar_customer_id: "polar_cus_001",
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true });

      const { data: credits } = await admin
        .from("user_credits")
        .select("onetime_balance, subscription_balance, balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(credits?.onetime_balance).toBe(before!.onetime_balance + 1500);
      expect(credits?.subscription_balance).toBe(before!.subscription_balance);
      expect(credits?.balance).toBe(credits!.onetime_balance + credits!.subscription_balance);
    });

    it("동일 order_id 재구매 시 orders 중복 생성되지 않는다", async () => {
      // 두 번째 호출 — 크레딧은 다시 추가됨 (RPC는 멱등하지 않음 - credit은 누적)
      // 하지만 orders는 ON CONFLICT DO NOTHING
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 1500,
        p_order_id: `${TEST_ORDER_PREFIX}credit_1500`,
        p_amount_cents: 1000,
        p_polar_product_id: "prod_credit_1500",
      });

      const { data: orders } = await admin
        .from("orders")
        .select("id")
        .eq("id", `${TEST_ORDER_PREFIX}credit_1500`);

      expect(orders?.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 환불 처리
  // ─────────────────────────────────────────────────────
  describe("process_refund", () => {
    it("크레딧 팩 전액 환불 시 크레딧을 회수한다", async () => {
      // 먼저 새 크레딧 팩 구매
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 700,
        p_order_id: `${TEST_ORDER_PREFIX}refund_test`,
        p_amount_cents: 500,
        p_polar_product_id: "prod_credit_700",
      });

      const { data: before } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      const { data, error } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: `${TEST_ORDER_PREFIX}refund_test`,
        p_credits_to_revoke: 700,
        p_refund_type: "full",
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, actual_deducted: 700, shortfall: 0 });

      const { data: after } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(after!.onetime_balance).toBe(before!.onetime_balance - 700);

      // orders 상태 확인
      const { data: order } = await admin
        .from("orders")
        .select("status")
        .eq("id", `${TEST_ORDER_PREFIX}refund_test`)
        .single();

      expect(order?.status).toBe("refunded");
    });

    it("잔액 부족 시 0으로 설정하고 shortfall을 기록한다", async () => {
      // 현재 onetime_balance를 확인
      const { data: credits } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      // 새 주문 생성 (직접 insert)
      await admin.from("orders").upsert({
        id: `${TEST_ORDER_PREFIX}shortfall`,
        user_id: TEST_USER_ID,
        polar_product_id: "prod_credit_9999",
        product_type: "credit_pack",
        amount_cents: 9999,
        credits_granted: 99999,
        status: "paid",
      });

      const { data, error } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: `${TEST_ORDER_PREFIX}shortfall`,
        p_credits_to_revoke: 99999,
        p_refund_type: "full",
      });

      expect(error).toBeNull();
      expect(data?.success).toBe(true);
      expect(data?.shortfall).toBeGreaterThan(0);
      expect(data?.actual_deducted).toBe(credits!.onetime_balance);

      // 잔액 0 확인
      const { data: after } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(after?.onetime_balance).toBe(0);
    });

    it("존재하지 않는 주문에 대해 실패한다", async () => {
      const { data } = await admin.rpc("process_refund", {
        p_user_id: TEST_USER_ID,
        p_order_id: "nonexistent_order",
        p_credits_to_revoke: 100,
      });

      expect(data).toMatchObject({ success: false, error: "order not found" });
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 구독 해지
  // ─────────────────────────────────────────────────────
  describe("process_subscription_revoke", () => {
    it("구독을 해지하고 subscription_balance를 0으로 리셋한다", async () => {
      // 먼저 구독 재활성화
      await admin.rpc("process_subscription_activation", {
        p_user_id: TEST_USER_ID,
        p_plan_id: "basic",
        p_polar_subscription_id: "polar_sub_revoke",
        p_polar_customer_id: "polar_cus_001",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits: 2000,
      });

      const { data, error } = await admin.rpc("process_subscription_revoke", {
        p_user_id: TEST_USER_ID,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, revoked_credits: 2000 });

      // 크레딧 확인
      const { data: credits } = await admin
        .from("user_credits")
        .select("subscription_balance, onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(credits?.subscription_balance).toBe(0);
      // onetime은 보존됨
      expect(credits?.onetime_balance).toBe(0); // 이전 테스트에서 0이 됨

      // 구독 상태 확인
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("plan_id, status")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(sub?.plan_id).toBe("free");
      expect(sub?.status).toBe("revoked");
    });

    it("이미 free 유저에게도 안전하게 동작한다", async () => {
      const { data, error } = await admin.rpc("process_subscription_revoke", {
        p_user_id: TEST_USER_ID,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, revoked_credits: 0 });
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 웹훅 이벤트 멱등성
  // ─────────────────────────────────────────────────────
  describe("webhook_events 멱등성", () => {
    it("동일 ID로 두 번 삽입하면 두 번째는 unique violation 발생", async () => {
      await admin.from("webhook_events").insert({
        id: "test_idempotent_001",
        event_type: "order.paid",
        payload: { test: true },
      });

      const { error } = await admin.from("webhook_events").insert({
        id: "test_idempotent_001",
        event_type: "order.paid",
        payload: { test: true },
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe("23505");
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 복합 시나리오: 구독 + 크레딧 팩 동시 보유
  // ─────────────────────────────────────────────────────
  describe("복합 시나리오", () => {
    it("구독 활성화 후 크레딧 팩 구매 → 잔액이 정확히 합산된다", async () => {
      // 1. 구독 활성화 (subscription_balance = 4400)
      const { error: subErr } = await admin.rpc("process_subscription_activation", {
        p_user_id: TEST_USER_ID,
        p_plan_id: "pro",
        p_polar_subscription_id: "polar_sub_composite",
        p_polar_customer_id: "polar_cus_001",
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits: 4400,
        p_order_id: `${TEST_ORDER_PREFIX}composite_sub`,
        p_amount_cents: 1900,
        p_polar_product_id: "prod_pro",
      });
      expect(subErr).toBeNull();

      // 현재 onetime 확인
      const { data: mid } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();
      const onetimeBefore = mid!.onetime_balance;

      // 2. 크레딧 팩 구매 (+700 onetime)
      const { error: creditErr } = await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 700,
        p_order_id: `${TEST_ORDER_PREFIX}composite_credit`,
        p_amount_cents: 500,
        p_polar_product_id: "prod_credit_700",
        p_polar_customer_id: "polar_cus_001",
      });
      expect(creditErr).toBeNull();

      // 3. 검증
      const { data: credits } = await admin
        .from("user_credits")
        .select("subscription_balance, onetime_balance, balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(credits?.subscription_balance).toBe(4400);
      expect(credits?.onetime_balance).toBe(onetimeBefore + 700);
      expect(credits?.balance).toBe(4400 + onetimeBefore + 700);
    });

    it("구독 해지 시 onetime 크레딧은 보존된다", async () => {
      const { data: before } = await admin
        .from("user_credits")
        .select("onetime_balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      const { error } = await admin.rpc("process_subscription_revoke", {
        p_user_id: TEST_USER_ID,
      });
      expect(error).toBeNull();

      const { data: credits } = await admin
        .from("user_credits")
        .select("subscription_balance, onetime_balance, balance")
        .eq("user_id", TEST_USER_ID)
        .single();

      expect(credits?.subscription_balance).toBe(0);
      expect(credits?.onetime_balance).toBe(before!.onetime_balance); // 보존!
      expect(credits?.balance).toBe(before!.onetime_balance);
    });
  });

  // ─────────────────────────────────────────────────────
  // 7. 트랜잭션 감사 추적
  // ─────────────────────────────────────────────────────
  describe("credit_transactions 감사 추적", () => {
    it("모든 크레딧 변동에 대해 트랜잭션이 기록되어 있다", async () => {
      const { data: txns } = await admin
        .from("credit_transactions")
        .select("type")
        .eq("user_id", TEST_USER_ID);

      expect(txns!.length).toBeGreaterThan(0);

      const types = txns!.map((t) => t.type);
      expect(types).toContain("subscription_grant");
      expect(types).toContain("onetime_purchase");
      expect(types).toContain("refund");
    });
  });
});

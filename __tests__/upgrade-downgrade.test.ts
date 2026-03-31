/**
 * 업/다운그레이드 통합 테스트 — 실제 DB에서 크레딧 계산 검증
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, supabaseServiceKey);

let TEST_USER_ID: string;
const TEST_EMAIL = "upgrade-test@phos.studio";

async function cleanup() {
  if (!TEST_USER_ID) return;
  await admin.from("credit_transactions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("orders").delete().like("id", "test_upgrade_%");
  await admin.from("user_subscriptions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("user_credits").delete().eq("user_id", TEST_USER_ID);
  await admin.from("users").delete().eq("id", TEST_USER_ID);
  const { data } = await admin.auth.admin.listUsers();
  const u = data?.users?.find((u) => u.email === TEST_EMAIL);
  if (u) await admin.auth.admin.deleteUser(u.id);
}

async function setup() {
  await cleanup();
  const { data } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: "test-password-123!",
    email_confirm: true,
  });
  TEST_USER_ID = data.user!.id;

  await admin.from("users").upsert({
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: "Upgrade Test",
    auth_provider: "test",
    role: "user",
  });

  await admin.from("user_credits").upsert({
    user_id: TEST_USER_ID,
    balance: 0,
    subscription_balance: 0,
    onetime_balance: 0,
    period_credits_granted: 0,
  });
}

async function getCredits() {
  const { data } = await admin
    .from("user_credits")
    .select("subscription_balance, onetime_balance, balance, period_credits_granted")
    .eq("user_id", TEST_USER_ID)
    .single();
  return data!;
}

async function activateSubscription(planId: string, credits: number, oldPlanCredits?: number) {
  return admin.rpc("process_subscription_activation", {
    p_user_id: TEST_USER_ID,
    p_plan_id: planId,
    p_polar_subscription_id: `polar_sub_${planId}`,
    p_polar_customer_id: "polar_cus_test",
    p_period_start: new Date().toISOString(),
    p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    p_credits: credits,
    p_order_id: `test_upgrade_${planId}_${Date.now()}`,
    p_amount_cents: credits,
    p_polar_product_id: `prod_${planId}`,
    ...(oldPlanCredits !== undefined && { p_old_plan_credits: oldPlanCredits }),
  });
}

async function simulateUsage(amount: number) {
  await admin.rpc("deduct_credits", {
    p_user_id: TEST_USER_ID,
    p_amount: amount,
    p_description: "test usage",
  });
}

describe("업/다운그레이드 통합 테스트", () => {
  beforeAll(setup);
  afterAll(cleanup);

  // ─────────────────────────────────────────────────────
  // 1. 신규 구독
  // ─────────────────────────────────────────────────────
  describe("신규 구독", () => {
    it("Basic 구독 시 전액 2000 크레딧 부여", async () => {
      const { data, error } = await activateSubscription("basic", 2000);
      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, subscription_balance: 2000 });

      const credits = await getCredits();
      expect(credits.subscription_balance).toBe(2000);
      expect(credits.period_credits_granted).toBe(2000);
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 업그레이드 — 사용량 차감
  // ─────────────────────────────────────────────────────
  describe("업그레이드 (사용량 차감)", () => {
    it("Basic(2000) 중 500 사용 후 Pro(4400) 업그레이드 → 3900", async () => {
      await simulateUsage(500);

      const before = await getCredits();
      expect(before.subscription_balance).toBe(1500);

      // 업그레이드: p_old_plan_credits = period_credits_granted(2000)
      const { data, error } = await activateSubscription("pro", 4400, before.period_credits_granted);
      expect(error).toBeNull();

      // 사용량 = 2000 - 1500 = 500, 새 잔액 = 4400 - 500 = 3900
      expect(data).toMatchObject({ success: true, subscription_balance: 3900, used_credits: 500 });

      const after = await getCredits();
      expect(after.subscription_balance).toBe(3900);
      expect(after.period_credits_granted).toBe(3900);
    });

    it("Pro(4400) 중 2000 사용 후 Premium(7100) 업그레이드 → 5100", async () => {
      await simulateUsage(2000);

      const before = await getCredits();
      expect(before.subscription_balance).toBe(1900);

      const { data, error } = await activateSubscription("premium", 7100, before.period_credits_granted);
      expect(error).toBeNull();

      // 사용량 = 3900 - 1900 = 2000, 새 잔액 = 7100 - 2000 = 5100
      expect(data).toMatchObject({ success: true, subscription_balance: 5100, used_credits: 2000 });

      const after = await getCredits();
      expect(after.subscription_balance).toBe(5100);
      expect(after.period_credits_granted).toBe(5100);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 악용 방지 — 크레딧 다 쓰고 업그레이드
  // ─────────────────────────────────────────────────────
  describe("악용 방지", () => {
    it("Premium(7100) 크레딧 전부 사용 후 같은 플랜 재구독해도 악용 불가", async () => {
      // 먼저 Basic으로 리셋
      const { error: resetErr } = await activateSubscription("basic", 2000);
      expect(resetErr).toBeNull();

      // 전부 사용
      await simulateUsage(2000);
      const empty = await getCredits();
      expect(empty.subscription_balance).toBe(0);

      // Pro로 업그레이드
      const { data, error } = await activateSubscription("pro", 4400, empty.period_credits_granted);
      expect(error).toBeNull();

      // 사용량 = 2000 - 0 = 2000, 새 잔액 = 4400 - 2000 = 2400
      expect(data).toMatchObject({ success: true, subscription_balance: 2400, used_credits: 2000 });

      const after = await getCredits();
      expect(after.subscription_balance).toBe(2400);
      // 11500이 아닌 2400만 받음 — 악용 차단됨!
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 다운그레이드 — 크레딧 변경 없음
  // ─────────────────────────────────────────────────────
  describe("다운그레이드 (next_period)", () => {
    it("Pro → Basic 다운그레이드 시 크레딧 유지, plan_id만 변경", async () => {
      // Pro 활성화
      const { error: proErr } = await activateSubscription("pro", 4400);
      expect(proErr).toBeNull();

      await simulateUsage(1000);
      const before = await getCredits();
      expect(before.subscription_balance).toBe(3400);

      // 다운그레이드: plan_id만 변경 (웹훅 핸들러 로직 시뮬레이션)
      await admin
        .from("user_subscriptions")
        .update({ plan_id: "basic", updated_at: new Date().toISOString() })
        .eq("user_id", TEST_USER_ID);

      // 크레딧은 변경 없음!
      const after = await getCredits();
      expect(after.subscription_balance).toBe(3400); // 그대로
      expect(after.period_credits_granted).toBe(4400); // 그대로

      // plan_id만 바뀜
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("plan_id")
        .eq("user_id", TEST_USER_ID)
        .single();
      expect(sub?.plan_id).toBe("basic");
    });

    it("다음 갱신 시 새 플랜(Basic 2000) 크레딧 전액 부여", async () => {
      // 월간 갱신 시뮬레이션: p_old_plan_credits = null (갱신이므로)
      const { data, error } = await activateSubscription("basic", 2000);
      expect(error).toBeNull();
      expect(data).toMatchObject({ success: true, subscription_balance: 2000 });

      const after = await getCredits();
      expect(after.subscription_balance).toBe(2000);
      expect(after.period_credits_granted).toBe(2000);
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 연속 업/다운 — 꼬임 방지 (period_credits_granted)
  // ─────────────────────────────────────────────────────
  describe("연속 플랜 변경 — 꼬임 방지", () => {
    it("Basic→Pro→Premium→Pro 연속 변경 시 크레딧 정확", async () => {
      // Basic 신규
      await activateSubscription("basic", 2000);
      await simulateUsage(800);

      let credits = await getCredits();
      expect(credits.subscription_balance).toBe(1200);

      // Basic→Pro 업그레이드
      // 사용량=2000-1200=800, 새잔액=4400-800=3600
      const { data: d1 } = await activateSubscription("pro", 4400, credits.period_credits_granted);
      expect(d1).toMatchObject({ subscription_balance: 3600, used_credits: 800 });

      // Pro에서 1000 더 사용
      await simulateUsage(1000);
      credits = await getCredits();
      expect(credits.subscription_balance).toBe(2600);

      // Pro→Premium 업그레이드
      // period_credits_granted=3600, 사용량=3600-2600=1000, 새잔액=7100-1000=6100
      const { data: d2 } = await activateSubscription("premium", 7100, credits.period_credits_granted);
      expect(d2).toMatchObject({ subscription_balance: 6100, used_credits: 1000 });

      // Premium에서 100 사용
      await simulateUsage(100);
      credits = await getCredits();
      expect(credits.subscription_balance).toBe(6000);

      // Premium→Pro 다운그레이드 (크레딧 변경 없음)
      await admin
        .from("user_subscriptions")
        .update({ plan_id: "pro", updated_at: new Date().toISOString() })
        .eq("user_id", TEST_USER_ID);

      credits = await getCredits();
      expect(credits.subscription_balance).toBe(6000); // 유지
      expect(credits.period_credits_granted).toBe(6100); // 유지
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 단건 구매 + 업그레이드 독립성
  // ─────────────────────────────────────────────────────
  describe("단건 구매 + 업그레이드 독립성", () => {
    it("단건 크레딧은 업그레이드 계산에 영향 안 줌", async () => {
      // Basic 신규
      await activateSubscription("basic", 2000);

      // 단건 700 구매
      await admin.rpc("process_credit_purchase", {
        p_user_id: TEST_USER_ID,
        p_credits: 700,
        p_order_id: `test_upgrade_credit_${Date.now()}`,
        p_amount_cents: 500,
        p_polar_product_id: "prod_credit_700",
      });

      // 1500 사용 (onetime 700 먼저 소진 → subscription 800 차감)
      await simulateUsage(1500);

      const before = await getCredits();
      expect(before.onetime_balance).toBe(0);
      expect(before.subscription_balance).toBe(1200); // 2000 - 800

      // Pro 업그레이드
      // period_credits_granted=2000, 사용량=2000-1200=800
      // 새잔액=4400-800=3600 (단건 700은 계산에 무관)
      const { data } = await activateSubscription("pro", 4400, before.period_credits_granted);
      expect(data).toMatchObject({ subscription_balance: 3600, used_credits: 800 });

      const after = await getCredits();
      expect(after.subscription_balance).toBe(3600);
      expect(after.onetime_balance).toBe(0); // 단건은 독립
    });
  });

  // ─────────────────────────────────────────────────────
  // 7. 다운그레이드 후 다시 업그레이드
  // ─────────────────────────────────────────────────────
  describe("다운그레이드 후 재업그레이드", () => {
    it("Pro→Basic 다운그레이드 후 다시 Premium 업그레이드 시 정확한 계산", async () => {
      // Pro 신규
      await activateSubscription("pro", 4400);
      await simulateUsage(1000);

      // Pro→Basic 다운그레이드 (크레딧 유지)
      await admin
        .from("user_subscriptions")
        .update({ plan_id: "basic", updated_at: new Date().toISOString() })
        .eq("user_id", TEST_USER_ID);

      let credits = await getCredits();
      expect(credits.subscription_balance).toBe(3400);
      expect(credits.period_credits_granted).toBe(4400); // Pro 때 기록된 값 유지

      // 500 더 사용
      await simulateUsage(500);
      credits = await getCredits();
      expect(credits.subscription_balance).toBe(2900);

      // Premium 업그레이드
      // period_credits_granted=4400, 사용량=4400-2900=1500
      // 새잔액=7100-1500=5600
      const { data } = await activateSubscription("premium", 7100, credits.period_credits_granted);
      expect(data).toMatchObject({ subscription_balance: 5600, used_credits: 1500 });
    });
  });
});

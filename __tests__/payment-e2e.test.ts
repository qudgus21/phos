/**
 * E2E 결제 테스트 — Polar Sandbox 실제 결제 → 웹훅 → DB 검증
 *
 * 실행 전 필요:
 * 1. ngrok이 로컬 3000에 연결되어 있어야 함
 * 2. Polar Sandbox 웹훅이 ngrok URL로 설정되어 있어야 함
 * 3. Next.js dev 서버가 실행 중이어야 함
 *
 * 실행:
 *   npx vitest run __tests__/payment-e2e.test.ts --timeout 120000
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Polar } from "@polar-sh/sdk";
import { chromium, type Browser, type Page } from "playwright";

// ── 환경 설정 ────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLAR_TOKEN = process.env.POLAR_ACCESS_TOKEN!;

const PRODUCTS = {
  basic: process.env.POLAR_PRODUCT_BASIC!,
  pro: process.env.POLAR_PRODUCT_PRO!,
  premium: process.env.POLAR_PRODUCT_PREMIUM!,
  credit_1500: process.env.POLAR_PRODUCT_CREDIT_1500!,
};

const TEST_USER_ID = "6d4927be-dcd4-44b9-afb9-bca1a72b54fc";
const TEST_EMAIL = "hbh4231@gmail.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !POLAR_TOKEN) {
  throw new Error("Missing environment variables for E2E tests");
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const polar = new Polar({ accessToken: POLAR_TOKEN, server: "sandbox" });

let browser: Browser;

// ── 헬퍼 함수 ────────────────────────────────────────────

/** Polar 고객 삭제 (존재하면) */
async function deletePolarCustomer() {
  const { data: user } = await admin
    .from("users")
    .select("polar_customer_id")
    .eq("id", TEST_USER_ID)
    .single();

  if (user?.polar_customer_id) {
    try {
      await polar.customers.delete({ id: user.polar_customer_id });
    } catch {
      // 이미 삭제됨 — 무시
    }
    // revoked 웹훅 처리 대기 + rate limit 방지
    await sleep(5000);
  }
}

/** Rate limit 방지 딜레이 */
async function rateLimitDelay() {
  await sleep(3000);
}

/** DB 완전 초기화 */
async function resetDb() {
  await admin.from("credit_transactions").delete().eq("user_id", TEST_USER_ID);
  await admin.from("orders").delete().eq("user_id", TEST_USER_ID);
  await admin.from("webhook_events").delete().neq("id", "keep"); // 전부 삭제

  await admin.from("user_credits").update({
    subscription_balance: 0,
    onetime_balance: 0,
    balance: 0,
    period_credits_granted: 0,
    last_generation_at: null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", TEST_USER_ID);

  await admin.from("user_subscriptions").update({
    plan_id: "free",
    status: "active",
    scheduled_plan_id: null,
    external_subscription_id: null,
    external_customer_id: null,
    current_period_start: null,
    current_period_end: null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", TEST_USER_ID);

  await admin.from("users").update({
    polar_customer_id: null,
  }).eq("id", TEST_USER_ID);
}

/** DB 상태 조회 */
async function getState() {
  const [{ data: credits }, { data: subscription }] = await Promise.all([
    admin.from("user_credits").select("*").eq("user_id", TEST_USER_ID).single(),
    admin.from("user_subscriptions").select("*").eq("user_id", TEST_USER_ID).single(),
  ]);
  return { credits: credits!, subscription: subscription! };
}

/** 구독 ID 조회 */
async function getSubscriptionId(): Promise<string> {
  const { data } = await admin
    .from("user_subscriptions")
    .select("external_subscription_id")
    .eq("user_id", TEST_USER_ID)
    .single();
  return data!.external_subscription_id!;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** DB를 폴링하여 특정 조건이 만족될 때까지 대기 */
async function waitFor(
  check: () => Promise<boolean>,
  timeout = 20000,
  interval = 1000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await sleep(interval);
  }
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/** 특정 플랜으로 변경될 때까지 대기 */
async function waitForPlan(planId: string, timeout = 20000) {
  await waitFor(async () => {
    const { subscription } = await getState();
    return subscription.plan_id === planId;
  }, timeout);
}

/** 구독 크레딧이 특정 값이 될 때까지 대기 */
async function waitForCredits(minBalance: number, timeout = 20000) {
  await waitFor(async () => {
    const { credits } = await getState();
    return credits.subscription_balance >= minBalance;
  }, timeout);
}

/** 구독 상태가 특정 값이 될 때까지 대기 */
async function waitForStatus(status: string, timeout = 20000) {
  await waitFor(async () => {
    const { subscription } = await getState();
    return subscription.status === status;
  }, timeout);
}

/** scheduled_plan_id가 설정될 때까지 대기 */
async function waitForScheduled(planId: string, timeout = 20000) {
  await waitFor(async () => {
    const { subscription } = await getState();
    return subscription.scheduled_plan_id === planId;
  }, timeout);
}

/** Playwright로 Polar 체크아웃 결제 */
async function completeCheckout(checkoutUrl: string) {
  const page = await browser.newPage();
  try {
    await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    // SPA 렌더링 대기 — Polar 체크아웃은 React 앱
    await page.waitForTimeout(8000);

    // 폼 작성 (이미 값이 있으면 skip)
    const emailInput = page.locator('input[name="customer_email"]');
    if (await emailInput.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(TEST_EMAIL);
    }
    const nameInput = page.locator('input[name="customer_name"]');
    if (await nameInput.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill("Test User");
    }
    const countrySelect = page.locator('select[autocomplete="billing country"]');
    if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await countrySelect.selectOption("KR");
    }
    await page.waitForTimeout(500);

    // Stripe 카드 입력 (저장된 카드가 없는 경우에만)
    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    const cardInput = stripeFrame.locator('input[name="number"]');
    if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cardInput.fill("4242424242424242");
      await page.waitForTimeout(300);
      await stripeFrame.locator('input[name="expiry"]').fill("1234");
      await page.waitForTimeout(300);
      await stripeFrame.locator('input[name="cvc"]').fill("123");
      await page.waitForTimeout(1000);
    } else {
      // 기존 카드가 저장되어 있음 — 바로 결제 가능
      await page.waitForTimeout(2000);
    }

    // 결제
    const submitBtn = page.locator('button[type="submit"]');
    try {
      await submitBtn.waitFor({ state: "visible", timeout: 15000 });
    } catch {
      // 디버그: 스크린샷 저장
      await page.screenshot({ path: `/tmp/e2e-fail-${Date.now()}.png`, fullPage: true });
      const text = await page.locator("body").innerText();
      throw new Error(`Submit button not found. Page text: ${text.substring(0, 300)}`);
    }
    await submitBtn.click();

    // 성공 페이지 대기
    await page.waitForURL("**/success**", { timeout: 30000 });
  } finally {
    await page.close();
  }
}

/** 체크아웃 URL 생성 + 결제 완료 */
async function subscribeToProduct(productId: string) {
  await rateLimitDelay();
  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail: TEST_EMAIL,
    externalCustomerId: TEST_USER_ID,
    successUrl: "https://example.com/success",
    allowDiscountCodes: false,
  });
  await completeCheckout(checkout.url);
}

// ══════════════════════════════════════════════════════════
// 테스트
// ══════════════════════════════════════════════════════════

describe("E2E 결제 테스트", () => {
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    // 마지막 정리
    await deletePolarCustomer();
    await resetDb();
    await browser?.close();
  }, 30000);

  // ── 신규 구독 & 크레딧 팩 ──────────────────────────────

  describe("신규 구독 & 크레딧 팩", () => {
    beforeEach(async () => {
      await deletePolarCustomer();
      await resetDb();
    }, 30000);

    it("4-1: Basic 신규 구독 → 크레딧 2000", async () => {
      await subscribeToProduct(PRODUCTS.basic);
      await waitForCredits(2000);

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(2000);
      expect(credits.onetime_balance).toBe(0);
      expect(subscription.plan_id).toBe("basic");
      expect(subscription.status).toBe("active");
    }, 60000);

    it("4-8: 크레딧 팩 1500 구매 → 일회성 1500", async () => {
      await subscribeToProduct(PRODUCTS.credit_1500);

      await waitFor(async () => {
        const { credits } = await getState();
        return credits.onetime_balance >= 1500;
      });

      const { credits } = await getState();
      expect(credits.onetime_balance).toBe(1500);
      expect(credits.subscription_balance).toBe(0);
    }, 60000);
  });

  // ── 업/다운그레이드 ───────────────────────────────────

  describe("업/다운그레이드", () => {
    beforeEach(async () => {
      await deletePolarCustomer();
      await resetDb();
      // Basic 구독부터 시작
      await subscribeToProduct(PRODUCTS.basic);
      await waitForCredits(2000);
    }, 60000);

    it("4-3: Basic→Pro 업그레이드 → 크레딧 4400", async () => {
      const subId = await getSubscriptionId();

      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: {
          productId: PRODUCTS.pro,
          prorationBehavior: "invoice",
        },
      });

      await waitForPlan("pro");

      const { credits, subscription } = await getState();
      // 2000 - 2000 + 4400 = 4400 (차액 2400 추가)
      expect(credits.subscription_balance).toBe(4400);
      expect(subscription.plan_id).toBe("pro");
    }, 60000);

    it("4-4: Pro→Basic 다운그레이드 → scheduled=basic, 크레딧 유지", async () => {
      const subId = await getSubscriptionId();

      // 먼저 Pro로 업그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.pro, prorationBehavior: "invoice" },
      });
      await waitForPlan("pro");
      const { credits: beforeDowngrade } = await getState();

      // Basic으로 다운그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.basic, prorationBehavior: "next_period" },
      });

      await waitForScheduled("basic");

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(beforeDowngrade.subscription_balance); // 변경 없음
      expect(subscription.plan_id).toBe("pro"); // 아직 Pro
      expect(subscription.scheduled_plan_id).toBe("basic");
    }, 90000);

    it("E1: 다중 업그레이드 Basic→Pro→Premium", async () => {
      const subId = await getSubscriptionId();

      // Basic→Pro
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.pro, prorationBehavior: "invoice" },
      });
      await waitForPlan("pro");

      const { credits: afterPro } = await getState();
      expect(afterPro.subscription_balance).toBe(4400);

      // Pro→Premium
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.premium, prorationBehavior: "invoice" },
      });
      await waitForPlan("premium");

      const { credits: afterPremium } = await getState();
      // 4400 - 4400 + 7100 = 7100
      expect(afterPremium.subscription_balance).toBe(7100);
    }, 90000);
  });

  // ── 취소 & 해지 ───────────────────────────────────────

  describe("취소 & 해지", () => {
    beforeEach(async () => {
      await deletePolarCustomer();
      await resetDb();
      // Basic 구독부터 시작
      await subscribeToProduct(PRODUCTS.basic);
      await waitForCredits(2000);
    }, 60000);

    it("4-5: 구독 취소 → 크레딧 유지, status=canceled", async () => {
      const subId = await getSubscriptionId();

      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });

      await waitForStatus("canceled");

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(2000); // 유지
      expect(subscription.status).toBe("canceled");
      expect(subscription.plan_id).toBe("basic"); // 플랜 유지
    }, 60000);

    it("4-6: 취소 철회 → status=active, 크레딧 변경 없음", async () => {
      const subId = await getSubscriptionId();

      // 취소
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
      await waitForStatus("canceled");

      // 취소 철회
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: false },
      });
      await waitForStatus("active");

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(2000); // 변경 없음
    }, 60000);

    it("4-7: 구독 해지(revoke) → 크레딧 유지, plan=free", async () => {
      const subId = await getSubscriptionId();

      await polar.subscriptions.revoke({ id: subId });

      await waitForPlan("free");

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(2000); // 유지 (뺏지 않음)
      expect(subscription.plan_id).toBe("free");
      expect(subscription.status).toBe("revoked");
    }, 60000);
  });

  // ── 복합 시나리오 ──────────────────────────────────────

  describe("복합 시나리오", () => {
    beforeEach(async () => {
      await deletePolarCustomer();
      await resetDb();
      // Basic 구독부터 시작
      await subscribeToProduct(PRODUCTS.basic);
      await waitForCredits(2000);
    }, 60000);

    it("E2: 업그레이드 후 즉시 다운그레이드", async () => {
      const subId = await getSubscriptionId();

      // Pro 업그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.pro, prorationBehavior: "invoice" },
      });
      await waitForPlan("pro");

      // Basic 다운그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.basic, prorationBehavior: "next_period" },
      });
      await waitForScheduled("basic");

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(4400); // Pro 크레딧 유지
      expect(subscription.plan_id).toBe("pro"); // 아직 Pro
      expect(subscription.scheduled_plan_id).toBe("basic");
    }, 90000);

    it("E4: 다운그레이드 예약 후 취소 — 예약 보존", async () => {
      const subId = await getSubscriptionId();

      // Pro 업그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.pro, prorationBehavior: "invoice" },
      });
      await waitForPlan("pro");

      // Basic 다운그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.basic, prorationBehavior: "next_period" },
      });
      await waitForScheduled("basic");

      // 취소
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
      await waitForStatus("canceled");

      const { subscription } = await getState();
      expect(subscription.status).toBe("canceled");
      expect(subscription.scheduled_plan_id).toBe("basic"); // 보존됨
    }, 90000);

    it("E5: 취소 후 재구독 (취소 철회)", async () => {
      const subId = await getSubscriptionId();

      // 취소
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
      await waitForStatus("canceled");

      const { credits: beforeUncancel } = await getState();

      // 취소 철회
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: false },
      });
      await waitForStatus("active");

      const { credits } = await getState();
      expect(credits.subscription_balance).toBe(beforeUncancel.subscription_balance);
    }, 60000);

    it("E14: 해지 후 재구독", async () => {
      const subId = await getSubscriptionId();

      // 해지
      await polar.subscriptions.revoke({ id: subId });
      await waitForPlan("free");

      const { credits: afterRevoke } = await getState();
      expect(afterRevoke.subscription_balance).toBe(2000); // 유지

      // 새 Pro 구독 (새 체크아웃 필요)
      await subscribeToProduct(PRODUCTS.pro);
      await waitForPlan("pro");

      const { credits } = await getState();
      // 기존 2000 + Pro 4400 = 6400
      expect(credits.subscription_balance).toBe(6400);
    }, 90000);

    it("E16: 업그레이드 후 즉시 취소 — 크레딧 유지", async () => {
      const subId = await getSubscriptionId();

      // Pro 업그레이드
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { productId: PRODUCTS.pro, prorationBehavior: "invoice" },
      });
      await waitForPlan("pro");

      const { credits: afterUpgrade } = await getState();

      // 즉시 취소
      await polar.subscriptions.update({
        id: subId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
      await waitForStatus("canceled");

      const { credits, subscription } = await getState();
      expect(credits.subscription_balance).toBe(afterUpgrade.subscription_balance); // 유지
      expect(subscription.status).toBe("canceled");
      expect(subscription.plan_id).toBe("pro"); // Pro 유지
    }, 90000);
  });
});

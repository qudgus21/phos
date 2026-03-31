import type { PlanId } from "@/lib/types/credits";

// ── 구독 상품 매핑 ──────────────────────────────────────

interface SubscriptionProduct {
  planId: PlanId;
  credits: number;
}

const SUBSCRIPTION_PRODUCTS: Record<string, SubscriptionProduct> = {};
const PLAN_TO_POLAR: Record<string, string> = {};

function registerSubscription(envKey: string, planId: PlanId, credits: number) {
  const polarId = process.env[envKey];
  if (polarId) {
    SUBSCRIPTION_PRODUCTS[polarId] = { planId, credits };
    PLAN_TO_POLAR[planId] = polarId;
  }
}

registerSubscription("POLAR_PRODUCT_BASIC", "basic", 2000);
registerSubscription("POLAR_PRODUCT_PRO", "pro", 4400);
registerSubscription("POLAR_PRODUCT_PREMIUM", "premium", 7100);

// ── 크레딧 팩 매핑 ──────────────────────────────────────

interface CreditPackProduct {
  credits: number;
  priceCents: number;
}

const CREDIT_PACK_PRODUCTS: Record<string, CreditPackProduct> = {};
const CREDITS_TO_POLAR: Record<number, string> = {};

function registerCreditPack(envKey: string, credits: number, priceCents: number) {
  const polarId = process.env[envKey];
  if (polarId) {
    CREDIT_PACK_PRODUCTS[polarId] = { credits, priceCents };
    CREDITS_TO_POLAR[credits] = polarId;
  }
}

registerCreditPack("POLAR_PRODUCT_CREDIT_700", 700, 500);
registerCreditPack("POLAR_PRODUCT_CREDIT_1500", 1500, 1000);
registerCreditPack("POLAR_PRODUCT_CREDIT_2400", 2400, 1500);
registerCreditPack("POLAR_PRODUCT_CREDIT_3300", 3300, 2000);
registerCreditPack("POLAR_PRODUCT_CREDIT_5100", 5100, 3000);

// ── 조회 함수 ─────────────────────────────────────────

export function getSubscriptionByPolarId(polarProductId: string): SubscriptionProduct | null {
  return SUBSCRIPTION_PRODUCTS[polarProductId] ?? null;
}

export function getCreditPackByPolarId(polarProductId: string): CreditPackProduct | null {
  return CREDIT_PACK_PRODUCTS[polarProductId] ?? null;
}

export function isSubscriptionProduct(polarProductId: string): boolean {
  return polarProductId in SUBSCRIPTION_PRODUCTS;
}

export function getPolarProductIdForPlan(planId: PlanId): string | null {
  return PLAN_TO_POLAR[planId] ?? null;
}

export function getPolarProductIdForCreditPack(credits: number): string | null {
  return CREDITS_TO_POLAR[credits] ?? null;
}

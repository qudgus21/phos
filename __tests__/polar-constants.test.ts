/**
 * Polar 상품 매핑 상수 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// 환경변수 모킹
vi.stubEnv("POLAR_PRODUCT_BASIC", "prod_basic_123");
vi.stubEnv("POLAR_PRODUCT_PRO", "prod_pro_456");
vi.stubEnv("POLAR_PRODUCT_PREMIUM", "prod_premium_789");
vi.stubEnv("POLAR_PRODUCT_CREDIT_700", "prod_credit_700");
vi.stubEnv("POLAR_PRODUCT_CREDIT_1500", "prod_credit_1500");
vi.stubEnv("POLAR_PRODUCT_CREDIT_2400", "prod_credit_2400");
vi.stubEnv("POLAR_PRODUCT_CREDIT_3300", "prod_credit_3300");
vi.stubEnv("POLAR_PRODUCT_CREDIT_5100", "prod_credit_5100");

describe("Polar Constants - 상품 매핑", () => {
  let constants: typeof import("@/lib/constants/polar");

  beforeEach(async () => {
    // 모듈 캐시를 초기화하여 환경변수 반영
    vi.resetModules();
    constants = await import("@/lib/constants/polar");
  });

  describe("isSubscriptionProduct", () => {
    it("구독 상품 ID를 올바르게 식별한다", () => {
      expect(constants.isSubscriptionProduct("prod_basic_123")).toBe(true);
      expect(constants.isSubscriptionProduct("prod_pro_456")).toBe(true);
      expect(constants.isSubscriptionProduct("prod_premium_789")).toBe(true);
    });

    it("크레딧 팩 상품을 구독으로 식별하지 않는다", () => {
      expect(constants.isSubscriptionProduct("prod_credit_700")).toBe(false);
      expect(constants.isSubscriptionProduct("prod_credit_5100")).toBe(false);
    });

    it("존재하지 않는 상품 ID에 false를 반환한다", () => {
      expect(constants.isSubscriptionProduct("unknown_product")).toBe(false);
      expect(constants.isSubscriptionProduct("")).toBe(false);
    });
  });

  describe("getSubscriptionByPolarId", () => {
    it("각 구독 상품의 planId와 credits를 올바르게 반환한다", () => {
      expect(constants.getSubscriptionByPolarId("prod_basic_123")).toEqual({
        planId: "basic",
        credits: 2000,
      });
      expect(constants.getSubscriptionByPolarId("prod_pro_456")).toEqual({
        planId: "pro",
        credits: 4400,
      });
      expect(constants.getSubscriptionByPolarId("prod_premium_789")).toEqual({
        planId: "premium",
        credits: 7100,
      });
    });

    it("크레딧 팩 상품 ID에 null을 반환한다", () => {
      expect(constants.getSubscriptionByPolarId("prod_credit_700")).toBeNull();
    });

    it("존재하지 않는 상품 ID에 null을 반환한다", () => {
      expect(constants.getSubscriptionByPolarId("nonexistent")).toBeNull();
    });
  });

  describe("getCreditPackByPolarId", () => {
    it("각 크레딧 팩의 credits와 priceCents를 올바르게 반환한다", () => {
      expect(constants.getCreditPackByPolarId("prod_credit_700")).toEqual({
        credits: 700,
        priceCents: 500,
      });
      expect(constants.getCreditPackByPolarId("prod_credit_1500")).toEqual({
        credits: 1500,
        priceCents: 1000,
      });
      expect(constants.getCreditPackByPolarId("prod_credit_2400")).toEqual({
        credits: 2400,
        priceCents: 1500,
      });
      expect(constants.getCreditPackByPolarId("prod_credit_3300")).toEqual({
        credits: 3300,
        priceCents: 2000,
      });
      expect(constants.getCreditPackByPolarId("prod_credit_5100")).toEqual({
        credits: 5100,
        priceCents: 3000,
      });
    });

    it("구독 상품 ID에 null을 반환한다", () => {
      expect(constants.getCreditPackByPolarId("prod_basic_123")).toBeNull();
    });
  });

  describe("getPolarProductIdForPlan", () => {
    it("planId로 Polar 상품 ID를 조회한다", () => {
      expect(constants.getPolarProductIdForPlan("basic")).toBe("prod_basic_123");
      expect(constants.getPolarProductIdForPlan("pro")).toBe("prod_pro_456");
      expect(constants.getPolarProductIdForPlan("premium")).toBe("prod_premium_789");
    });

    it("free 플랜은 null을 반환한다", () => {
      expect(constants.getPolarProductIdForPlan("free")).toBeNull();
    });
  });

  describe("getPolarProductIdForCreditPack", () => {
    it("크레딧 수로 Polar 상품 ID를 조회한다", () => {
      expect(constants.getPolarProductIdForCreditPack(700)).toBe("prod_credit_700");
      expect(constants.getPolarProductIdForCreditPack(5100)).toBe("prod_credit_5100");
    });

    it("존재하지 않는 크레딧 수에 null을 반환한다", () => {
      expect(constants.getPolarProductIdForCreditPack(999)).toBeNull();
    });
  });
});

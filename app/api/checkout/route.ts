import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/supabase/middleware";
import { createPolarClient } from "@/lib/polar";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPolarProductIdForPlan,
  getPolarProductIdForCreditPack,
} from "@/lib/constants/polar";
import { ValidationError } from "@/lib/errors";

// ── 더블 클릭 방지 (모듈 레벨 60초 TTL) ──────────────────
const recentCheckouts = new Map<string, number>();

function cleanupRecentCheckouts() {
  const now = Date.now();
  for (const [key, ts] of recentCheckouts) {
    if (now - ts > 60_000) recentCheckouts.delete(key);
  }
}

// ── 요청 스키마 ──────────────────────────────────────────

const checkoutSchema = z.discriminatedUnion("productType", [
  z.object({
    productType: z.literal("subscription"),
    planId: z.enum(["basic", "pro", "premium"]),
  }),
  z.object({
    productType: z.literal("credit_pack"),
    creditPackCredits: z.enum(["700", "1500", "2400", "3300", "5100"]).transform(Number),
  }),
]);

// ── POST /api/checkout ───────────────────────────────────

export const POST = withAuth(async (request, { user }) => {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError("잘못된 요청입니다", parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;

  // 1. Polar 상품 ID 조회
  let polarProductId: string | null = null;

  if (data.productType === "subscription") {
    polarProductId = getPolarProductIdForPlan(data.planId);
  } else {
    polarProductId = getPolarProductIdForCreditPack(data.creditPackCredits);
  }

  if (!polarProductId) {
    throw new ValidationError("상품을 찾을 수 없습니다");
  }

  // 2. 더블 클릭 방지
  cleanupRecentCheckouts();
  const checkoutKey = `${user.id}:${polarProductId}`;
  const lastCheckout = recentCheckouts.get(checkoutKey);

  if (lastCheckout && Date.now() - lastCheckout < 60_000) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요" } },
      { status: 429 }
    );
  }

  recentCheckouts.set(checkoutKey, Date.now());

  try {
    const polar = createPolarClient();

    // ── 구독 업/다운그레이드 감지 ──────────────────────────
    if (data.productType === "subscription") {
      const admin = createAdminClient();
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("plan_id, status, external_subscription_id")
        .eq("user_id", user.id)
        .single();

      // 이미 유료 구독 중이고, 다른 플랜으로 변경 요청이면 → 상품 변경 API
      if (
        sub &&
        sub.status === "active" &&
        sub.plan_id !== "free" &&
        sub.plan_id !== data.planId &&
        sub.external_subscription_id
      ) {
        const planOrder = ["basic", "pro", "premium"];
        const isUpgrade = planOrder.indexOf(data.planId) > planOrder.indexOf(sub.plan_id);

        const updated = await polar.subscriptions.update({
          id: sub.external_subscription_id,
          subscriptionUpdate: {
            productId: polarProductId,
            prorationBehavior: isUpgrade ? "invoice" : "next_period",
          },
        });

        // 업그레이드: scheduled_plan_id 초기화 / 다운그레이드: 예약 저장
        await admin
          .from("user_subscriptions")
          .update({
            scheduled_plan_id: isUpgrade ? null : data.planId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        recentCheckouts.delete(checkoutKey);

        return NextResponse.json({
          success: true,
          data: {
            upgraded: isUpgrade,
            downgraded: !isUpgrade,
            fromPlan: sub.plan_id,
            toPlan: data.planId,
            subscriptionId: updated.id,
          },
        });
      }
    }

    // ── 신규 구독 또는 크레딧 팩 → 체크아웃 세션 ────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      customerEmail: user.email ?? undefined,
      externalCustomerId: user.id,
      successUrl: `${appUrl}/pricing?checkout=success`,
      allowDiscountCodes: true,
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: checkout.url },
    });
  } catch (err) {
    recentCheckouts.delete(checkoutKey);

    console.error("[checkout] Polar API failed:", err);
    return NextResponse.json(
      { success: false, error: { code: "CHECKOUT_FAILED", message: "결제 처리에 실패했습니다" } },
      { status: 500 }
    );
  }
});

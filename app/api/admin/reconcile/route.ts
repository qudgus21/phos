import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPolarClient } from "@/lib/polar";
import {
  isSubscriptionProduct,
  getSubscriptionByPolarId,
} from "@/lib/constants/polar";

/**
 * POST /api/admin/reconcile
 * 웹훅 누락 시 특정 유저의 구독/크레딧 상태를 Polar와 동기화
 */
export const POST = withAdmin(async (request: NextRequest) => {
  const { userId } = await request.json();

  if (!userId || typeof userId !== "string") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: "userId가 필요합니다" } },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. 유저의 polar_customer_id 조회
  const { data: userRow } = await admin
    .from("users")
    .select("polar_customer_id")
    .eq("id", userId)
    .single();

  if (!userRow?.polar_customer_id) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CUSTOMER", message: "Polar 고객 ID가 없습니다" } },
      { status: 404 }
    );
  }

  const polar = createPolarClient();
  const changes: string[] = [];

  try {
    // 2. Polar에서 활성 구독 조회
    const subscriptions = await polar.subscriptions.list({
      customerId: userRow.polar_customer_id,
      active: true,
    });

    const activeSub = subscriptions.result.items?.[0];

    if (activeSub && isSubscriptionProduct(activeSub.productId)) {
      const plan = getSubscriptionByPolarId(activeSub.productId);
      if (plan) {
        const { data: rpcResult } = await admin.rpc("process_subscription_activation", {
          p_user_id: userId,
          p_plan_id: plan.planId,
          p_polar_subscription_id: activeSub.id,
          p_polar_customer_id: userRow.polar_customer_id,
          p_period_start: activeSub.currentPeriodStart.toISOString(),
          p_period_end: activeSub.currentPeriodEnd.toISOString(),
          p_credits: plan.credits,
        });

        changes.push(`Subscription synced: plan=${plan.planId}, credits=${plan.credits}`);

        if (rpcResult && typeof rpcResult === "object" && "success" in rpcResult && !rpcResult.success) {
          changes.push(`Warning: RPC returned error - ${JSON.stringify(rpcResult)}`);
        }
      }
    } else {
      // Polar에 활성 구독 없음 → 로컬도 free로 맞춤
      const { data: localSub } = await admin
        .from("user_subscriptions")
        .select("plan_id, status")
        .eq("user_id", userId)
        .single();

      if (localSub && localSub.plan_id !== "free" && localSub.status === "active") {
        await admin.rpc("process_subscription_revoke", { p_user_id: userId });
        changes.push(`Subscription revoked: was plan=${localSub.plan_id}, now free`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        polarCustomerId: userRow.polar_customer_id,
        changes,
      },
    });
  } catch (err) {
    console.error("[admin/reconcile] Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "RECONCILE_FAILED", message: "동기화 중 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
});

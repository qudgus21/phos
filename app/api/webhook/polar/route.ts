import { NextRequest } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSubscriptionProduct,
  getSubscriptionByPolarId,
  getCreditPackByPolarId,
} from "@/lib/constants/polar";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook/polar] Missing POLAR_WEBHOOK_SECRET");
    return new Response("Server configuration error", { status: 500 });
  }

  // ── 서명 검증 ──────────────────────────────────────────
  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(
      body,
      Object.fromEntries(request.headers),
      webhookSecret
    );
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      console.error("[webhook/polar] Invalid signature");
      return new Response("Invalid signature", { status: 403 });
    }
    throw e;
  }

  // ── 멱등성 체크 (INSERT 선행 → 레이스 컨디션 방지) ─────
  const webhookId = request.headers.get("webhook-id");
  if (!webhookId) {
    return new Response("Missing webhook-id", { status: 400 });
  }

  const admin = createAdminClient();

  const { data: inserted } = await admin
    .from("webhook_events")
    .upsert(
      { id: webhookId, event_type: event.type, payload: JSON.parse(body) },
      { onConflict: "id", ignoreDuplicates: true }
    )
    .select("id")
    .single();

  if (!inserted) {
    return Response.json({ received: true, duplicate: true });
  }

  // ── 이벤트 분기 처리 ───────────────────────────────────
  try {
    switch (event.type) {
      case "order.paid":
        await handleOrderPaid(event.data);
        break;

      case "order.refunded":
        await handleOrderRefunded(event.data);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(event.data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;

      case "subscription.revoked":
        await handleSubscriptionRevoked(event.data);
        break;

      case "subscription.uncanceled":
        await handleSubscriptionUncanceled(event.data);
        break;

      default:
        console.log(`[webhook/polar] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (err) {
    console.error(`[webhook/polar] Error handling ${event.type}:`, err);
    await admin.from("webhook_events").delete().eq("id", webhookId);
    return new Response("Internal error", { status: 500 });
  }

  return Response.json({ received: true });
}

// ── 유저 ID 식별 ─────────────────────────────────────────

async function resolveUserId(customer: {
  id: string;
  externalId?: string | null;
}): Promise<string | null> {
  if (customer.externalId) {
    return customer.externalId;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("polar_customer_id", customer.id)
    .single();

  if (!data) {
    console.error("[webhook/polar] resolveUserId: No user found for polar customer:", customer.id);
  }

  return data?.id ?? null;
}

// ══════════════════════════════════════════════════════════
// order.paid — 크레딧 부여의 유일한 경로
//
// billing_reason:
//   "subscription_create"  → 신규 구독: 플랜 크레딧 부여
//   "subscription_cycle"   → 갱신: 플랜 크레딧 누적
//   "subscription_update"  → 업그레이드: 차액 크레딧 부여
//   (없음)                 → 크레딧 팩: 일회성 크레딧 부여
// ══════════════════════════════════════════════════════════

async function handleOrderPaid(order: {
  id: string;
  customer: { id: string; externalId?: string | null };
  product: { id: string } | null;
  subscription: { id: string; currentPeriodStart: Date; currentPeriodEnd: Date } | null;
  totalAmount: number;
  billingReason?: string | null;
}) {
  const userId = await resolveUserId(order.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] order.paid: Cannot resolve user for customer ${order.customer.id}`);
  }

  const productId = order.product?.id;
  if (!productId) {
    console.error("[webhook/polar] order.paid: No product in order", order.id);
    return;
  }

  const admin = createAdminClient();
  const billingReason = order.billingReason ?? "unknown";

  // ── 크레딧 팩 ──────────────────────────────────────────
  if (!isSubscriptionProduct(productId)) {
    const pack = getCreditPackByPolarId(productId);
    if (!pack) {
      console.error("[webhook/polar] order.paid: Unknown credit product:", productId);
      return;
    }

    const { error } = await admin.rpc("process_credit_purchase", {
      p_user_id: userId,
      p_credits: pack.credits,
      p_order_id: order.id,
      p_amount_cents: order.totalAmount,
      p_polar_product_id: productId,
      p_polar_customer_id: order.customer.id,
    });

    if (error) {
      console.error("[webhook/polar] process_credit_purchase failed:", error);
      throw error;
    }

    console.log(`[webhook/polar] Credits purchased: user=${userId}, credits=${pack.credits}`);
    return;
  }

  // ── 구독 상품 ──────────────────────────────────────────
  const plan = getSubscriptionByPolarId(productId);
  if (!plan) {
    console.error("[webhook/polar] order.paid: Unknown subscription product:", productId);
    return;
  }

  const sub = order.subscription;

  if (billingReason === "subscription_create" || billingReason === "subscription_cycle") {
    // 신규 구독 또는 갱신 → 플랜 크레딧 누적
    const { error } = await admin.rpc("process_subscription_activation", {
      p_user_id: userId,
      p_plan_id: plan.planId,
      p_polar_subscription_id: sub?.id ?? "",
      p_polar_customer_id: order.customer.id,
      p_period_start: sub?.currentPeriodStart?.toISOString() ?? new Date().toISOString(),
      p_period_end: sub?.currentPeriodEnd?.toISOString() ?? new Date().toISOString(),
      p_credits: plan.credits,
      p_order_id: order.id,
      p_amount_cents: order.totalAmount,
      p_polar_product_id: productId,
    });

    if (error) {
      console.error("[webhook/polar] process_subscription_activation failed:", error);
      throw error;
    }

    // 갱신 시 다운그레이드 예약 초기화
    await admin
      .from("user_subscriptions")
      .update({ scheduled_plan_id: null })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Subscription ${billingReason}: user=${userId}, plan=${plan.planId}, credits=${plan.credits}`);

  } else if (billingReason === "subscription_update") {
    // 업그레이드 차액 결제 → 주문 기록만 (크레딧은 subscription.updated에서 처리)
    if (order.id) {
      await admin.from("orders").upsert({
        id: order.id,
        user_id: userId,
        polar_product_id: productId,
        product_type: "subscription",
        amount_cents: order.totalAmount,
        credits_granted: 0,
        polar_subscription_id: sub?.id ?? "",
        status: "paid",
      }, { onConflict: "id", ignoreDuplicates: true });
    }

    console.log(`[webhook/polar] Upgrade invoice recorded (no credits): order=${order.id}, amount=${order.totalAmount}`);

  } else {
    // 알 수 없는 billing_reason → 안전하게 주문만 기록
    console.warn(`[webhook/polar] order.paid: Unknown billing_reason="${billingReason}", recording order only`);
    if (order.id) {
      await admin.from("orders").upsert({
        id: order.id,
        user_id: userId,
        polar_product_id: productId,
        product_type: "subscription",
        amount_cents: order.totalAmount,
        credits_granted: 0,
        polar_subscription_id: sub?.id ?? "",
        status: "paid",
      }, { onConflict: "id", ignoreDuplicates: true });
    }
  }
}

// ══════════════════════════════════════════════════════════
// order.refunded — 환불 처리
// ══════════════════════════════════════════════════════════

async function handleOrderRefunded(order: {
  id: string;
  customer: { id: string; externalId?: string | null };
  totalAmount: number;
  refundedAmount: number;
}) {
  const userId = await resolveUserId(order.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] order.refunded: Cannot resolve user for customer ${order.customer.id}`);
  }

  const admin = createAdminClient();

  const { data: localOrder } = await admin
    .from("orders")
    .select("credits_granted, amount_cents, status, metadata, product_type, polar_subscription_id")
    .eq("id", order.id)
    .single();

  if (!localOrder) {
    console.error("[webhook/polar] order.refunded: Order not found locally:", order.id);
    return;
  }

  if (localOrder.status === "refunded") {
    console.log("[webhook/polar] order.refunded: Already fully refunded:", order.id);
    return;
  }

  // 구독 환불 시 현재 구독과 주문의 구독이 다르면 경고
  if (localOrder.product_type === "subscription" && localOrder.polar_subscription_id) {
    const { data: currentSub } = await admin
      .from("user_subscriptions")
      .select("external_subscription_id")
      .eq("user_id", userId)
      .single();

    if (currentSub && currentSub.external_subscription_id !== localOrder.polar_subscription_id) {
      console.warn(
        `[webhook/polar] order.refunded: Refunding old subscription order after plan change. order=${order.id}, ` +
        `order_sub=${localOrder.polar_subscription_id}, current_sub=${currentSub.external_subscription_id}`
      );
    }
  }

  const prevRefundedCredits = (localOrder.metadata as Record<string, unknown>)?.total_refunded_credits as number ?? 0;

  const isFullRefund = order.refundedAmount >= order.totalAmount;
  let creditsToRevoke: number;

  if (isFullRefund) {
    creditsToRevoke = localOrder.credits_granted - prevRefundedCredits;
  } else {
    const totalProportionalCredits = localOrder.amount_cents > 0
      ? Math.floor((order.refundedAmount / localOrder.amount_cents) * localOrder.credits_granted)
      : 0;
    creditsToRevoke = Math.max(0, totalProportionalCredits - prevRefundedCredits);
  }

  if (creditsToRevoke <= 0) {
    console.log("[webhook/polar] order.refunded: No additional credits to revoke:", order.id);
    return;
  }

  const { error } = await admin.rpc("process_refund", {
    p_user_id: userId,
    p_order_id: order.id,
    p_credits_to_revoke: creditsToRevoke,
    p_refund_type: isFullRefund ? "full" : "partial",
  });

  if (error) {
    console.error("[webhook/polar] process_refund failed:", error);
    throw error;
  }

  const newTotalRefunded = prevRefundedCredits + creditsToRevoke;
  await admin
    .from("orders")
    .update({
      metadata: { ...(localOrder.metadata as Record<string, unknown>), total_refunded_credits: newTotalRefunded },
    })
    .eq("id", order.id);

  console.log(`[webhook/polar] Refund processed: order=${order.id}, credits=${creditsToRevoke}, total_refunded=${newTotalRefunded}`);
}

// ══════════════════════════════════════════════════════════
// subscription.updated — 크레딧 부여 없음. 플랜 상태 업데이트만.
//
// 업그레이드: 플랜 변경 + 크레딧 재계산 (차액)
// 다운그레이드: scheduled_plan_id 예약만
// 같은 플랜 / free→유료: 무시 (order.paid에서 처리)
// ══════════════════════════════════════════════════════════

async function handleSubscriptionUpdated(subscription: {
  id: string;
  customerId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  customer: { id: string; externalId?: string | null };
  pendingUpdate?: { productId: string | null } | null;
}) {
  const admin = createAdminClient();

  // pending_update가 있으면 다운그레이드 예약 (next_period)
  if (subscription.pendingUpdate?.productId) {
    const pendingPlan = getSubscriptionByPolarId(subscription.pendingUpdate.productId);
    if (!pendingPlan) {
      console.log("[webhook/polar] subscription.updated: Unknown pending product:", subscription.pendingUpdate.productId);
      return;
    }

    const userId = await resolveUserId(subscription.customer);
    if (!userId) {
      throw new Error(`[webhook/polar] subscription.updated: Cannot resolve user for customer ${subscription.customer.id}`);
    }

    await admin
      .from("user_subscriptions")
      .update({
        scheduled_plan_id: pendingPlan.planId,
        external_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Downgrade scheduled: user=${userId}, pending=${pendingPlan.planId}`);
    return;
  }

  // pending_update 없음 → 즉시 적용된 변경 (업그레이드)
  if (!isSubscriptionProduct(subscription.productId)) {
    console.log("[webhook/polar] subscription.updated: Not a subscription product:", subscription.productId);
    return;
  }

  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] subscription.updated: Cannot resolve user for customer ${subscription.customer.id}`);
  }

  const plan = getSubscriptionByPolarId(subscription.productId);
  if (!plan) {
    console.error("[webhook/polar] subscription.updated: Unknown plan for product:", subscription.productId);
    return;
  }

  const { data: currentSub } = await admin
    .from("user_subscriptions")
    .select("plan_id, subscription_plans(monthly_credits)")
    .eq("user_id", userId)
    .single();

  const oldPlanId = currentSub?.plan_id ?? "free";
  const oldPlanCredits = (currentSub?.subscription_plans as Record<string, unknown>)?.monthly_credits as number ?? 0;

  // 같은 플랜이거나 free→유료(신규 구독)면 무시 — order.paid에서 처리
  if (oldPlanId === plan.planId || oldPlanId === "free") {
    console.log(`[webhook/polar] subscription.updated: ${oldPlanId} → ${plan.planId}, skipping — handled by order.paid`);
    return;
  }

  const planOrder = ["free", "basic", "pro", "premium"];
  const isUpgrade = planOrder.indexOf(plan.planId) > planOrder.indexOf(oldPlanId);

  if (isUpgrade) {
    // 업그레이드: 플랜 변경 + 크레딧 차액 부여
    const { error } = await admin.rpc("process_subscription_activation", {
      p_user_id: userId,
      p_plan_id: plan.planId,
      p_polar_subscription_id: subscription.id,
      p_polar_customer_id: subscription.customer.id,
      p_period_start: subscription.currentPeriodStart.toISOString(),
      p_period_end: subscription.currentPeriodEnd.toISOString(),
      p_credits: plan.credits,
      p_old_plan_credits: oldPlanCredits,
    });
    if (error) { console.error("[webhook/polar] upgrade failed:", error); throw error; }

    await admin
      .from("user_subscriptions")
      .update({ scheduled_plan_id: null })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Upgraded: user=${userId}, ${oldPlanId} → ${plan.planId}`);
  } else {
    // productId가 바뀌었는데 pending_update가 없는 다운그레이드 (예외 케이스)
    await admin
      .from("user_subscriptions")
      .update({
        scheduled_plan_id: plan.planId,
        external_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Downgrade scheduled (fallback): user=${userId}, ${oldPlanId} → ${plan.planId}`);
  }
}

// ══════════════════════════════════════════════════════════
// subscription.canceled / revoked / uncanceled
// ══════════════════════════════════════════════════════════

async function handleSubscriptionCanceled(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] subscription.canceled: Cannot resolve user for customer ${subscription.customer.id}`);
  }

  const admin = createAdminClient();
  // 취소 시 다운그레이드 예약도 해제 — 다음 결제가 없으므로 의미 없음
  const { error } = await admin
    .from("user_subscriptions")
    .update({ status: "canceled", scheduled_plan_id: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("[webhook/polar] subscription.canceled update failed:", error);
    throw error;
  }

  console.log(`[webhook/polar] Subscription canceled: user=${userId}`);
}

async function handleSubscriptionRevoked(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] subscription.revoked: Cannot resolve user for customer ${subscription.customer.id}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("process_subscription_revoke", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[webhook/polar] process_subscription_revoke failed:", error);
    throw error;
  }

  console.log(`[webhook/polar] Subscription revoked: user=${userId}`);
}

async function handleSubscriptionUncanceled(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    throw new Error(`[webhook/polar] subscription.uncanceled: Cannot resolve user for customer ${subscription.customer.id}`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("[webhook/polar] subscription.uncanceled update failed:", error);
    throw error;
  }

  console.log(`[webhook/polar] Subscription uncanceled: user=${userId}`);
}

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

  // ── 멱등성 체크 ────────────────────────────────────────
  const webhookId = request.headers.get("webhook-id");
  if (!webhookId) {
    return new Response("Missing webhook-id", { status: 400 });
  }

  const admin = createAdminClient();

  // 이미 처리 완료된 이벤트인지 확인
  const { data: existing } = await admin
    .from("webhook_events")
    .select("id")
    .eq("id", webhookId)
    .single();

  if (existing) {
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
        // checkout.*, subscription.created, subscription.active 등 → 로그만
        console.log(`[webhook/polar] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (err) {
    console.error(`[webhook/polar] Error handling ${event.type}:`, err);
    // 처리 실패 → 500 반환 → Polar가 재시도
    // webhook_events에 기록하지 않아 재시도 시 다시 처리됨
    return new Response("Internal error", { status: 500 });
  }

  // ── 처리 성공 후에만 멱등성 기록 ────────────────────────
  const { error: insertError } = await admin
    .from("webhook_events")
    .insert({
      id: webhookId,
      event_type: event.type,
      payload: JSON.parse(body),
    });

  if (insertError && insertError.code !== "23505") {
    // 삽입 실패해도 처리는 이미 성공했으므로 200 반환
    // (RPCs가 멱등이므로 재처리해도 안전)
    console.error("[webhook/polar] Failed to record webhook_events:", insertError);
  }

  return Response.json({ received: true });
}

// ── 유저 ID 식별 ─────────────────────────────────────────

async function resolveUserId(customer: {
  id: string;
  externalId?: string | null;
}): Promise<string | null> {
  // 1. externalId = Supabase user ID (체크아웃 시 전달)
  if (customer.externalId) {
    return customer.externalId;
  }

  // 2. fallback: polar_customer_id로 조회
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

// ── order.paid ───────────────────────────────────────────

async function handleOrderPaid(order: {
  id: string;
  customer: { id: string; externalId?: string | null };
  product: { id: string } | null;
  subscription: { id: string; currentPeriodStart: Date; currentPeriodEnd: Date } | null;
  totalAmount: number;
}) {
  const userId = await resolveUserId(order.customer);
  if (!userId) {
    console.error("[webhook/polar] order.paid: Cannot resolve user for customer", order.customer.id);
    return;
  }

  const productId = order.product?.id;
  if (!productId) {
    console.error("[webhook/polar] order.paid: No product in order", order.id);
    return;
  }

  const admin = createAdminClient();

  if (isSubscriptionProduct(productId)) {
    const plan = getSubscriptionByPolarId(productId);
    if (!plan) {
      console.error("[webhook/polar] order.paid: Unknown subscription product:", productId);
      return;
    }

    const sub = order.subscription;
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

    console.log(`[webhook/polar] Subscription activated: user=${userId}, plan=${plan.planId}`);
  } else {
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
  }
}

// ── order.refunded ───────────────────────────────────────

async function handleOrderRefunded(order: {
  id: string;
  customer: { id: string; externalId?: string | null };
  totalAmount: number;
  refundedAmount: number;
}) {
  const userId = await resolveUserId(order.customer);
  if (!userId) {
    console.error("[webhook/polar] order.refunded: Cannot resolve user");
    return;
  }

  const admin = createAdminClient();

  // 로컬 orders 테이블에서 주문 정보 조회
  const { data: localOrder } = await admin
    .from("orders")
    .select("credits_granted, amount_cents, status, metadata")
    .eq("id", order.id)
    .single();

  if (!localOrder) {
    console.error("[webhook/polar] order.refunded: Order not found locally:", order.id);
    return;
  }

  // 이미 전액 환불 처리된 주문은 스킵
  if (localOrder.status === "refunded") {
    console.log("[webhook/polar] order.refunded: Already fully refunded:", order.id);
    return;
  }

  // 이전에 환불된 크레딧 수 계산 (metadata에서 추적)
  const prevRefundedCredits = (localOrder.metadata as Record<string, unknown>)?.total_refunded_credits as number ?? 0;

  const isFullRefund = order.refundedAmount >= order.totalAmount;
  let creditsToRevoke: number;

  if (isFullRefund) {
    // 전액 환불: 남은 미환불 크레딧 전부 회수
    creditsToRevoke = localOrder.credits_granted - prevRefundedCredits;
  } else {
    // 부분 환불: 비례 계산 후 이전 환불분 차감 (증분만 회수)
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

  // 누적 환불 크레딧 추적 (orders.metadata에 기록)
  const newTotalRefunded = prevRefundedCredits + creditsToRevoke;
  await admin
    .from("orders")
    .update({
      metadata: { ...(localOrder.metadata as Record<string, unknown>), total_refunded_credits: newTotalRefunded },
    })
    .eq("id", order.id);

  console.log(`[webhook/polar] Refund processed: order=${order.id}, credits=${creditsToRevoke}, total_refunded=${newTotalRefunded}`);
}

// ── subscription.updated ─────────────────────────────────

async function handleSubscriptionUpdated(subscription: {
  id: string;
  customerId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  customer: { id: string; externalId?: string | null };
}) {
  // 플랜 변경 감지 — 새 상품이 구독 상품이면 재활성화
  if (!isSubscriptionProduct(subscription.productId)) {
    console.log("[webhook/polar] subscription.updated: Not a subscription product:", subscription.productId);
    return;
  }

  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    console.error("[webhook/polar] subscription.updated: Cannot resolve user");
    return;
  }

  const plan = getSubscriptionByPolarId(subscription.productId);
  if (!plan) {
    console.error("[webhook/polar] subscription.updated: Unknown plan for product:", subscription.productId);
    return;
  }

  const admin = createAdminClient();

  // 기존 플랜 조회
  const { data: currentSub } = await admin
    .from("user_subscriptions")
    .select("plan_id, subscription_plans(monthly_credits)")
    .eq("user_id", userId)
    .single();

  const oldPlanId = currentSub?.plan_id ?? "free";
  const oldPlanCredits = (currentSub?.subscription_plans as Record<string, unknown>)?.monthly_credits as number ?? 0;

  // 같은 플랜이면 갱신 → 전액 부여
  if (oldPlanId === plan.planId) {
    const { error } = await admin.rpc("process_subscription_activation", {
      p_user_id: userId,
      p_plan_id: plan.planId,
      p_polar_subscription_id: subscription.id,
      p_polar_customer_id: subscription.customer.id,
      p_period_start: subscription.currentPeriodStart.toISOString(),
      p_period_end: subscription.currentPeriodEnd.toISOString(),
      p_credits: plan.credits,
    });
    if (error) { console.error("[webhook/polar] subscription renewal failed:", error); throw error; }
    console.log(`[webhook/polar] Subscription renewed: user=${userId}, plan=${plan.planId}`);
    return;
  }

  // 업/다운그레이드 판별
  const planOrder = ["free", "basic", "pro", "premium"];
  const isUpgrade = planOrder.indexOf(plan.planId) > planOrder.indexOf(oldPlanId);

  if (isUpgrade) {
    // 업그레이드: 즉시 크레딧 재계산 (사용량 차감)
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

    // 업그레이드 시 다운그레이드 예약 초기화
    await admin
      .from("user_subscriptions")
      .update({ scheduled_plan_id: null })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Upgraded: user=${userId}, ${oldPlanId} → ${plan.planId}`);
  } else {
    // 다운그레이드: 크레딧/플랜 변경 안 함, scheduled_plan_id만 기록
    // → 다음 갱신(order.paid) 시 새 플랜 크레딧으로 자동 적용
    await admin
      .from("user_subscriptions")
      .update({
        scheduled_plan_id: plan.planId,
        external_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`[webhook/polar] Downgrade scheduled: user=${userId}, ${oldPlanId} → ${plan.planId} (credits unchanged until next period)`);
  }
}

// ── subscription.canceled ────────────────────────────────

async function handleSubscriptionCanceled(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    console.error("[webhook/polar] subscription.canceled: Cannot resolve user");
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("[webhook/polar] subscription.canceled update failed:", error);
    throw error;
  }

  console.log(`[webhook/polar] Subscription canceled: user=${userId}`);
}

// ── subscription.revoked ─────────────────────────────────

async function handleSubscriptionRevoked(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    console.error("[webhook/polar] subscription.revoked: Cannot resolve user");
    return;
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

// ── subscription.uncanceled ──────────────────────────────

async function handleSubscriptionUncanceled(subscription: {
  customer: { id: string; externalId?: string | null };
}) {
  const userId = await resolveUserId(subscription.customer);
  if (!userId) {
    console.error("[webhook/polar] subscription.uncanceled: Cannot resolve user");
    return;
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

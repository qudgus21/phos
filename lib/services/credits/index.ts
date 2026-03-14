import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UserCreditInfo,
  PlanInfo,
  DeductResult,
  PlanId,
} from "@/lib/types/credits";

/**
 * 유저의 크레딧 + 플랜 정보를 조회한다.
 */
export async function getUserCreditInfo(
  userId: string
): Promise<UserCreditInfo> {
  const admin = createAdminClient();

  const [creditsRes, subRes] = await Promise.all([
    admin
      .from("user_credits")
      .select("balance, subscription_balance, onetime_balance, last_generation_at")
      .eq("user_id", userId)
      .single(),
    admin
      .from("user_subscriptions")
      .select("plan_id, subscription_plans(*)")
      .eq("user_id", userId)
      .single(),
  ]);

  if (creditsRes.error || !creditsRes.data) {
    throw new Error("크레딧 정보를 조회할 수 없습니다");
  }

  // 구독이 없으면 Free 기본값
  const planRow = subRes.data?.subscription_plans as Record<string, unknown> | null;
  const plan: PlanInfo = planRow
    ? {
        id: planRow.id as PlanId,
        name: planRow.name as string,
        priceUsd: Number(planRow.price_usd),
        monthlyCredits: planRow.monthly_credits as number,
        maxBatchSize: planRow.max_batch_size as number,
        cooldownSeconds: planRow.cooldown_seconds as number,
        features: (planRow.features ?? {}) as Record<string, boolean>,
      }
    : {
        id: "free" as PlanId,
        name: "Free",
        priceUsd: 0,
        monthlyCredits: 200,
        maxBatchSize: 1,
        cooldownSeconds: 300,
        features: { watermark: true },
      };

  return {
    balance: {
      total: creditsRes.data.balance,
      subscription: creditsRes.data.subscription_balance,
      onetime: creditsRes.data.onetime_balance,
    },
    plan,
    lastGenerationAt: creditsRes.data.last_generation_at,
  };
}

/**
 * 원자적 크레딧 차감 (RPC)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<DeductResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_metadata: metadata ?? {},
  });

  if (error) {
    throw new Error(`크레딧 차감 실패: ${error.message}`);
  }

  const result = data as Record<string, unknown>;

  if (!result.success) {
    return {
      success: false,
      error: result.error as string,
      available: result.available as number,
      required: result.required as number,
    };
  }

  return {
    success: true,
    onetimeBalance: result.onetime_balance as number,
    subscriptionBalance: result.subscription_balance as number,
    totalBalance: result.total_balance as number,
    onetimeDeducted: result.onetime_deducted as number,
    subscriptionDeducted: result.subscription_deducted as number,
  };
}

/**
 * 크레딧 환불 (생성 실패 시 선차감분 복구)
 * deduct_credits가 차감한 비율(onetime/subscription)을 그대로 복원한다.
 */
export async function refundCredits(
  userId: string,
  onetimeAmount: number,
  subscriptionAmount: number,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  if (onetimeAmount > 0) {
    await admin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: onetimeAmount,
      p_credit_type: "onetime",
      p_transaction_type: "refund",
      p_description: description ?? "생성 실패 환불 (onetime)",
      p_metadata: metadata ?? {},
    });
  }

  if (subscriptionAmount > 0) {
    await admin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: subscriptionAmount,
      p_credit_type: "subscription",
      p_transaction_type: "refund",
      p_description: description ?? "생성 실패 환불 (subscription)",
      p_metadata: metadata ?? {},
    });
  }
}

/**
 * 쿨다운 잔여 시간 (초) 계산. 0이면 쿨다운 없음.
 */
export function checkCooldown(
  lastGenerationAt: string | null,
  cooldownSeconds: number
): number {
  if (!lastGenerationAt || cooldownSeconds <= 0) return 0;

  const elapsed = (Date.now() - new Date(lastGenerationAt).getTime()) / 1000;
  const remaining = cooldownSeconds - elapsed;

  return remaining > 0 ? Math.ceil(remaining) : 0;
}

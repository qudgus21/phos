import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

interface AdminUserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  authProvider: string;
  createdAt: string;
  credits: {
    total: number;
    subscription: number;
    onetime: number;
    lastGenerationAt: string | null;
  };
  subscription: {
    planId: string;
    planName: string;
    status: string;
  } | null;
}

export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  const admin = createAdminClient();

  // 이메일 지정 시 단건 조회, 없으면 전체 목록
  if (email) {
    const { data: user, error } = await admin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      throw new ApiError("유저를 찾을 수 없습니다", 404);
    }

    const [creditsRes, subRes] = await Promise.all([
      admin
        .from("user_credits")
        .select("balance, subscription_balance, onetime_balance, last_generation_at")
        .eq("user_id", user.id)
        .single(),
      admin
        .from("user_subscriptions")
        .select("plan_id, status, subscription_plans(name)")
        .eq("user_id", user.id)
        .single(),
    ]);

    const planRow = subRes.data?.subscription_plans as Record<string, unknown> | null;

    const result: AdminUserInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      authProvider: user.auth_provider,
      createdAt: user.created_at,
      credits: {
        total: creditsRes.data?.balance ?? 0,
        subscription: creditsRes.data?.subscription_balance ?? 0,
        onetime: creditsRes.data?.onetime_balance ?? 0,
        lastGenerationAt: creditsRes.data?.last_generation_at ?? null,
      },
      subscription: subRes.data
        ? {
            planId: subRes.data.plan_id,
            planName: (planRow?.name as string) ?? "Free",
            status: subRes.data.status,
          }
        : null,
    };

    const body: ApiResponse<AdminUserInfo> = { success: true, data: result };
    return NextResponse.json(body);
  }

  // 전체 유저 목록 (크레딧 포함)
  const { data: users, error } = await admin
    .from("users")
    .select(`
      *,
      user_credits(balance, subscription_balance, onetime_balance, last_generation_at),
      user_subscriptions(plan_id, status, subscription_plans(name))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError("유저 목록 조회 실패", 500);
  }

  const result: AdminUserInfo[] = (users ?? []).map((u) => {
    const credits = u.user_credits as Record<string, unknown> | null;
    const sub = u.user_subscriptions as Record<string, unknown> | null;
    const planRow = sub?.subscription_plans as Record<string, unknown> | null;

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      authProvider: u.auth_provider,
      createdAt: u.created_at,
      credits: {
        total: (credits?.balance as number) ?? 0,
        subscription: (credits?.subscription_balance as number) ?? 0,
        onetime: (credits?.onetime_balance as number) ?? 0,
        lastGenerationAt: (credits?.last_generation_at as string) ?? null,
      },
      subscription: sub
        ? {
            planId: sub.plan_id as string,
            planName: (planRow?.name as string) ?? "Free",
            status: sub.status as string,
          }
        : null,
    };
  });

  const body: ApiResponse<AdminUserInfo[]> = { success: true, data: result };
  return NextResponse.json(body);
});

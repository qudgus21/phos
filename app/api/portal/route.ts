import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { createPolarClient } from "@/lib/polar";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withAuth(async (_request, { user }) => {
  const admin = createAdminClient();

  // 유저의 polar_customer_id 조회
  const { data: userRow } = await admin
    .from("users")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  if (!userRow?.polar_customer_id) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CUSTOMER", message: "결제 이력이 없습니다" } },
      { status: 404 }
    );
  }

  try {
    const polar = createPolarClient();

    const session = await polar.customerSessions.create({
      customerId: userRow.polar_customer_id,
    });

    return NextResponse.json({
      success: true,
      data: { portalUrl: session.customerPortalUrl },
    });
  } catch (err) {
    console.error("[portal] Customer session creation failed:", err);
    return NextResponse.json(
      { success: false, error: { code: "PORTAL_FAILED", message: "고객 포털 세션 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
});

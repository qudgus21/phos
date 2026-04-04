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
      { success: false, error: { code: "NO_CUSTOMER", message: "No payment history found" } },
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
      { success: false, error: { code: "PORTAL_FAILED", message: "Failed to create billing portal session" } },
      { status: 500 }
    );
  }
});

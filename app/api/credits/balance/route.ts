import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { getUserCreditInfo } from "@/lib/services/credits";
import type { ApiResponse } from "@/lib/types/api";
import type { UserCreditInfo } from "@/lib/types/credits";

export const GET = withAuth(async (_request, { user }) => {
  const info = await getUserCreditInfo(user.id);

  const body: ApiResponse<UserCreditInfo> = {
    success: true,
    data: info,
  };

  return NextResponse.json(body);
});

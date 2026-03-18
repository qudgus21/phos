import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

export const DELETE = withAuth(async (request, { user }) => {
  const { id } = (await request.json()) as { id?: string };

  if (!id || typeof id !== "string") {
    throw new ValidationError("삭제할 히스토리 ID가 필요합니다");
  }

  const supabase = createAdminClient();

  // 본인 소유 확인 후 삭제
  const { error } = await supabase
    .from("generation_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new ValidationError("삭제에 실패했습니다");
  }

  const body: ApiResponse<{ deleted: true }> = {
    success: true,
    data: { deleted: true },
  };

  return NextResponse.json(body);
});

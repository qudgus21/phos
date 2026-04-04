import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import {
  createPresignedUploadUrl,
  getR2PublicUrl,
  deleteFromR2,
} from "@/lib/r2/client";
import { ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/lib/types/api";

/** presigned PUT URL 발급 (클라이언트 직접 업로드용) */
export const POST = withAuth(async (request, { user }) => {
  const { path, contentType } = (await request.json()) as {
    path?: string;
    contentType?: string;
  };

  if (!path || !contentType) {
    throw new ValidationError("path and contentType are required");
  }

  // 경로에 유저 ID가 포함되어야 함 (RLS 대체)
  if (!path.includes(user.id)) {
    throw new ValidationError("Path not allowed");
  }

  const uploadUrl = await createPresignedUploadUrl(path, contentType);
  const publicUrl = getR2PublicUrl(path);

  const body: ApiResponse<{ uploadUrl: string; publicUrl: string }> = {
    success: true,
    data: { uploadUrl, publicUrl },
  };
  return NextResponse.json(body);
});

/** R2 오브젝트 삭제 */
export const DELETE = withAuth(async (request, { user }) => {
  const { paths } = (await request.json()) as { paths?: string[] };

  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    throw new ValidationError("Path is required for deletion");
  }

  // 모든 경로에 유저 ID가 포함되어야 함
  if (paths.some((p) => !p.includes(user.id))) {
    throw new ValidationError("Path not allowed");
  }

  await deleteFromR2(paths);

  const body: ApiResponse<{ deleted: true }> = {
    success: true,
    data: { deleted: true },
  };
  return NextResponse.json(body);
});

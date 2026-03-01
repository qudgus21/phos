import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { AuthError, AppError, ApiError, ValidationError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiErrorResponse } from "@/lib/types/api";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

type RouteHandler = (
  request: NextRequest,
  context: {
    supabase: ReturnType<typeof createServerClient<Database>>;
    user: { id: string; email: string | null };
  }
) => Promise<NextResponse>;

type AdminRouteHandler = (
  request: NextRequest,
  context: {
    supabase: ReturnType<typeof createServerClient<Database>>;
    user: { id: string; email: string | null; role: string };
  }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest) => {
    let cookiesToForward: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient<Database>(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToForward = cookiesToSet;
          },
        },
      }
    );

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new AuthError("인증이 필요합니다");
      }

      const handlerResponse = await handler(request, {
        supabase,
        user: { id: user.id, email: user.email ?? null },
      });

      cookiesToForward.forEach(({ name, value, options }) => {
        handlerResponse.cookies.set(name, value, options);
      });

      return handlerResponse;
    } catch (err) {
      if (err instanceof AppError) {
        const body: ApiErrorResponse = {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err instanceof ValidationError && err.fields ? { fields: err.fields } : {}),
          },
        };
        return NextResponse.json(body, { status: err.statusCode });
      }

      const body: ApiErrorResponse = {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" },
      };
      return NextResponse.json(body, { status: 500 });
    }
  };
}

export function withAdmin(handler: AdminRouteHandler) {
  return withAuth(async (request, { supabase, user }) => {
    const admin = createAdminClient();
    const { data: userRow, error } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !userRow || userRow.role !== "admin") {
      throw new ApiError("관리자 권한이 필요합니다", 403);
    }

    return handler(request, {
      supabase,
      user: { ...user, role: userRow.role },
    });
  });
}

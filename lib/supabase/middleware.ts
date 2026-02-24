import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { AuthError, AppError } from "@/lib/errors";
import type { ApiErrorResponse } from "@/lib/types/api";

type RouteHandler = (
  request: NextRequest,
  context: {
    supabase: ReturnType<typeof createServerClient<Database>>;
    user: { id: string; email: string };
  }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest) => {
    const response = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
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

      return await handler(request, {
        supabase,
        user: { id: user.id, email: user.email ?? "" },
      });
    } catch (err) {
      if (err instanceof AppError) {
        const body: ApiErrorResponse = {
          success: false,
          error: { code: err.code, message: err.message },
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

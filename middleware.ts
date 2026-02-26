import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 — getUser()가 쿠키 refresh를 트리거
  const { error } = await supabase.auth.getUser();

  // 세션 쿠키가 있는데 유저가 유효하지 않은 경우 → 쿠키 정리
  // auth callback 경로는 제외 (PKCE code_verifier 쿠키가 signOut으로 삭제되면 OAuth 실패)
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/");
  if (error && !isAuthCallback) {
    const hasAuthCookies = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    if (hasAuthCookies) {
      await supabase.auth.signOut();
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

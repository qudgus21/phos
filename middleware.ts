import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { locales, detectLocale } from "@/lib/i18n";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

async function handleSupabase(
  request: NextRequest,
  extraRequestHeaders?: Record<string, string>
): Promise<NextResponse> {
  const requestHeaders = new Headers(request.headers);
  if (extraRequestHeaders) {
    for (const [key, value] of Object.entries(extraRequestHeaders)) {
      requestHeaders.set(key, value);
    }
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.getUser();

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files, API, auth, webhooks, metadata images — skip locale handling
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname.includes(".")
  ) {
    return handleSupabase(request);
  }

  // Check if first segment is a valid locale
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocale =
    firstSegment !== undefined &&
    locales.includes(firstSegment as (typeof locales)[number]);

  if (!hasLocale) {
    // No locale prefix — detect and redirect
    const detected = detectLocale(
      request.headers.get("accept-language") ?? ""
    );
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/" ? `/${detected}` : `/${detected}${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  // Valid locale — proceed with Supabase session + inject locale headers into the
  // forwarded request so that RSCs can read them via `headers()`.
  const response = await handleSupabase(request, {
    "x-locale": firstSegment,
    "x-dir": firstSegment === "ar" ? "rtl" : "ltr",
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhook/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

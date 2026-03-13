import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // PKCE flow — code 파라미터로 세션 교환
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(origin);
    }
  }

  // Implicit flow — token_hash로 직접 인증
  const allowedOtpTypes = ["signup", "email"] as const;
  type AllowedOtpType = (typeof allowedOtpTypes)[number];

  if (tokenHash && type) {
    if (!allowedOtpTypes.includes(type as AllowedOtpType)) {
      return NextResponse.redirect(`${origin}/?error=auth`);
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as AllowedOtpType,
    });
    if (!error) {
      return NextResponse.redirect(origin);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}

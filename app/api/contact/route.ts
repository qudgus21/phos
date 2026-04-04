import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserCreditInfo } from "@/lib/services/credits";
import { checkRateLimit } from "@/lib/services/contact/rate-limit";
import { sendInquiryEmail } from "@/lib/services/contact/email";
import { uploadToR2 } from "@/lib/r2/client";

const CATEGORIES = [
  "payment_refund",
  "bug_report",
  "feature_request",
  "account_issue",
  "other",
] as const;

const contactSchema = z.object({
  category: z.enum(CATEGORIES),
  subject: z.string().min(1, "Subject is required").max(200),
  content: z.string().min(1, "Message is required").max(5000),
  email: z.email("Invalid email address").optional().or(z.literal("")),
});

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    // --- 선택적 인증 ---
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // --- Rate Limiting ---
    const rateResult = checkRateLimit(ip, user?.id);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT",
            message: `Too many requests. Please try again in ${Math.ceil(rateResult.retryAfterSeconds / 60)} minutes.`,
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateResult.retryAfterSeconds) },
        }
      );
    }

    // --- FormData 파싱 ---
    const formData = await request.formData();

    const parsed = contactSchema.safeParse({
      category: formData.get("category"),
      subject: formData.get("subject"),
      content: formData.get("content"),
      email: formData.get("email") || undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: firstIssue.message },
        },
        { status: 400 }
      );
    }

    const { category, subject, content, email: guestEmail } = parsed.data;

    // --- 이미지 검증 + 업로드 ---
    const imageFiles: File[] = [];
    const images = formData.getAll("images");
    for (const img of images) {
      if (!(img instanceof File) || img.size === 0) continue;
      if (imageFiles.length >= MAX_IMAGES) break;
      if (img.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Image file size must be 5 MB or less.",
            },
          },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(img.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Only JPG, PNG, GIF, and WebP files are allowed.",
            },
          },
          { status: 400 }
        );
      }
      imageFiles.push(img);
    }

    const admin = createAdminClient();
    const inquiryId = crypto.randomUUID();
    const imageUrls: string[] = [];
    const imageAttachments: { filename: string; content: Buffer }[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${inquiryId}/${i}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      imageAttachments.push({
        filename: file.name || `image_${i}.${ext}`,
        content: buffer,
      });

      try {
        const publicUrl = await uploadToR2(
          buffer,
          `inquiry-images/${path}`,
          file.type
        );
        imageUrls.push(publicUrl);
      } catch (err) {
        console.error("[contact] R2 upload error:", err);
      }
    }

    // --- 유저 정보 조회 ---
    let userEmail: string | null = null;
    let userName: string | null = null;
    let userPlan: string | null = null;
    let userCredits: number | null = null;

    if (user) {
      userEmail = user.email ?? null;

      try {
        const creditInfo = await getUserCreditInfo(user.id);
        userPlan = creditInfo.plan.name;
        userCredits = creditInfo.balance.total;
      } catch {
        // 크레딧 정보 조회 실패해도 계속 진행
      }

      const { data: userRow } = await admin
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();
      userName = userRow?.name ?? null;
    }

    // --- DB 저장 ---
    const now = new Date().toISOString();
    const { error: insertError } = await admin.from("inquiries").insert({
      id: inquiryId,
      user_id: user?.id ?? null,
      email: guestEmail || null,
      category,
      subject,
      content,
      image_urls: imageUrls,
      user_email: userEmail,
      user_name: userName,
      user_plan: userPlan,
      user_credits: userCredits,
      ip_address: ip === "unknown" ? null : ip,
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("[contact] DB insert failed:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Failed to save your message." },
        },
        { status: 500 }
      );
    }

    // --- 이메일 발송 (실패해도 DB 저장은 유지) ---
    sendInquiryEmail({
      category,
      subject,
      content,
      imageUrls,
      userEmail,
      userName,
      userId: user?.id ?? null,
      userPlan,
      userCredits,
      guestEmail: guestEmail || null,
      ip: ip === "unknown" ? null : ip,
      createdAt: new Date(now).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      }),
      attachments: imageAttachments,
    }).catch((err) => {
      console.error("[contact] email send failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      },
      { status: 500 }
    );
  }
}

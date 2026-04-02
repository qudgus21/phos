import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const CATEGORY_LABELS: Record<string, string> = {
  payment_refund: "결제/환불",
  bug_report: "오류 신고",
  feature_request: "기능 제안",
  account_issue: "계정 문제",
  other: "기타",
};

interface SendInquiryEmailParams {
  category: string;
  subject: string;
  content: string;
  imageUrls: string[];
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  userPlan?: string | null;
  userCredits?: number | null;
  guestEmail?: string | null;
  ip?: string | null;
  createdAt: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendInquiryEmail(params: SendInquiryEmailParams) {
  const {
    category,
    subject,
    content,
    imageUrls,
    userEmail,
    userName,
    userId,
    userPlan,
    userCredits,
    guestEmail,
    ip,
    createdAt,
    attachments,
  } = params;

  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const isLoggedIn = !!userId;

  const userInfo = isLoggedIn
    ? `유저: ${userName ?? "-"} (${userEmail ?? "-"})
ID: ${userId}
플랜: ${userPlan ?? "Free"} / 크레딧: ${userCredits ?? 0}`
    : `유저: 비로그인${guestEmail ? ` (${guestEmail})` : ""}`;

  const plain = `[${categoryLabel}] ${subject}

${userInfo}

${content}${imageUrls.length > 0 ? `\n\n첨부 ${imageUrls.length}장:\n${imageUrls.join("\n")}` : ""}

${createdAt}${ip ? ` / IP: ${ip}` : ""}`;

  const html = `<pre style="font-family:monospace;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin:0;padding:20px;color:#333;background:#fff">${plain.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;

  const replyTo = userEmail ?? guestEmail ?? undefined;

  const userInfoText = isLoggedIn
    ? `이름: ${userName ?? "-"}\n이메일: ${userEmail ?? "-"}\nID: ${userId}\n플랜: ${userPlan ?? "Free"}\n크레딧: ${userCredits ?? 0}`
    : `상태: 비로그인 사용자${guestEmail ? `\n이메일: ${guestEmail}` : ""}`;

  const text = `[${categoryLabel}] ${subject}

── 사용자 정보 ──
${userInfoText}

── 문의 내용 ──
${content}
${imageUrls.length > 0 ? `\n── 첨부 이미지 (${imageUrls.length}) ──\n${imageUrls.join("\n")}` : ""}
──
접수: ${createdAt}${ip ? ` | IP: ${ip}` : ""}`;

  await getResend().emails.send({
    from: "Phos AI <onboarding@resend.dev>",
    to: "hbh4231@gmail.com",
    replyTo: replyTo || undefined,
    subject: `[Phos 문의] ${categoryLabel} - ${subject}`,
    html,
    text,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

}

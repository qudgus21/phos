import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const CATEGORY_LABELS: Record<string, string> = {
  payment_refund: "Payment / Refund",
  bug_report: "Bug report",
  feature_request: "Feature request",
  account_issue: "Account issue",
  other: "Other",
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
    ? `User: ${userName ?? "-"} (${userEmail ?? "-"})
ID: ${userId}
Plan: ${userPlan ?? "Free"} / Credits: ${userCredits ?? 0}`
    : `User: Guest${guestEmail ? ` (${guestEmail})` : ""}`;

  const plain = `[${categoryLabel}] ${subject}

${userInfo}

${content}${imageUrls.length > 0 ? `\n\n${imageUrls.length} attachments:\n${imageUrls.join("\n")}` : ""}

${createdAt}${ip ? ` / IP: ${ip}` : ""}`;

  const html = `<pre style="font-family:monospace;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin:0;padding:20px;color:#333;background:#fff">${plain.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error("OWNER_EMAIL environment variable is not set");
  }

  const replyTo = userEmail ?? guestEmail ?? undefined;

  const userInfoText = isLoggedIn
    ? `Name: ${userName ?? "-"}\nEmail: ${userEmail ?? "-"}\nID: ${userId}\nPlan: ${userPlan ?? "Free"}\nCredits: ${userCredits ?? 0}`
    : `Status: Guest user${guestEmail ? `\nEmail: ${guestEmail}` : ""}`;

  const text = `[${categoryLabel}] ${subject}

── User Info ──
${userInfoText}

── Message ──
${content}
${imageUrls.length > 0 ? `\n── Attachments (${imageUrls.length}) ──\n${imageUrls.join("\n")}` : ""}
──
Received: ${createdAt}${ip ? ` | IP: ${ip}` : ""}`;

  await getResend().emails.send({
    from: "Phos AI <onboarding@resend.dev>",
    to: ownerEmail,
    replyTo: replyTo || undefined,
    subject: `[Phos Contact] ${categoryLabel} - ${subject}`,
    html,
    text,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

}

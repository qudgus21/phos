import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { detectLocale } from "@/lib/i18n";

export default async function RootPage() {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language") ?? "";
  const locale = detectLocale(acceptLanguage);
  redirect(`/${locale}`);
}

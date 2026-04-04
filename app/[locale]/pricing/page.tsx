import { type Locale, getDictionary } from "@/lib/i18n";
import { Footer } from "@/components/sections/footer";
import PricingContent from "./pricing-content";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <PricingContent />
      <Footer dict={dict} locale={locale} />
    </>
  );
}

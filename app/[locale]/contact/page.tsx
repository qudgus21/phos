import { type Locale, getDictionary } from "@/lib/i18n";
import { Footer } from "@/components/sections/footer";
import ContactForm from "./contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <ContactForm />
      <Footer dict={dict} locale={locale} />
    </>
  );
}

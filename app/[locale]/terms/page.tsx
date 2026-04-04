import { type Locale, getDictionary } from "@/lib/i18n";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/sections/legal/legal-page-layout";

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <LegalPageLayout title={dict.legal.terms.title} lastUpdated={dict.legal.terms.lastUpdated} dict={dict} locale={locale}>
      {dict.legal.terms.sections.map((section, i) => (
        <LegalSection key={i} title={section.title}>
          <div dangerouslySetInnerHTML={{ __html: section.html }} />
        </LegalSection>
      ))}
    </LegalPageLayout>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import type { Dictionary } from "@/lib/i18n";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  dict: Dictionary;
  locale: string;
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
  dict,
  locale,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-3">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="legal-prose space-y-8 text-muted-foreground text-sm leading-relaxed">
          {children}
        </div>
      </div>
      <Footer dict={dict} locale={locale} />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

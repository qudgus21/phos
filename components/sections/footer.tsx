import Link from "next/link";
import { Zap, Mail } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

interface FooterProps {
  dict: Dictionary;
  locale: string;
}

export function Footer({ dict, locale }: FooterProps) {
  const footerSections = [
    {
      title: dict.footer.sections.aiFeatures,
      links: [
        { label: dict.footer.links.imageEdit, href: `/${locale}/image-edit` },
        { label: dict.footer.links.skinRetouch, href: `/${locale}/retouching` },
        { label: dict.footer.links.faceEdit, href: `/${locale}/face-edit` },
      ],
    },
    {
      title: dict.footer.sections.quickLinks,
      links: [
        { label: dict.footer.links.home, href: `/${locale}` },
        { label: dict.footer.links.pricing, href: `/${locale}/pricing` },
        { label: dict.footer.links.contact, href: `/${locale}/contact` },
      ],
    },
    {
      title: dict.footer.sections.policies,
      links: [
        { label: dict.footer.links.terms, href: `/${locale}/terms` },
        { label: dict.footer.links.privacy, href: `/${locale}/privacy` },
        { label: dict.footer.links.dataDeletion, href: `/${locale}/data-deletion` },
      ],
    },
  ];
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-xl font-extrabold text-primary font-display">
                Phos AI
              </h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {dict.footer.brand}
            </p>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-bold text-foreground mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Phos AI. All rights reserved.
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {dict.footer.contactLink}
          </Link>
        </div>
      </div>
    </footer>
  );
}

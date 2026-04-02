import Link from "next/link";
import { Zap, Mail } from "lucide-react";

const footerSections = [
  {
    title: "AI 기능",
    links: [
      { label: "이미지 편집", href: "/image-edit" },
      { label: "피부 보정", href: "/retouching" },
      { label: "얼굴 변경", href: "/face-edit" },
    ],
  },
  {
    title: "바로가기",
    links: [
      { label: "홈", href: "/" },
      { label: "가격", href: "/pricing" },
      { label: "문의하기", href: "/contact" },
    ],
  },
  {
    title: "정책",
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "데이터 삭제", href: "/data-deletion" },
    ],
  },
];

export function Footer() {
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
              AI 기반 이미지 편집, 보정, 생성 도구
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
            href="/contact"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            문의하기
          </Link>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Zap, Mail } from "lucide-react";

const footerSections = [
  {
    title: "AI 기능",
    links: [
      { label: "보정", href: "/retouching" },
      { label: "이미지 편집", href: "/image-edit" },
      { label: "얼굴 변경", href: "/face-edit" },
    ],
  },
  {
    title: "바로가기",
    links: [
      { label: "홈", href: "/" },
      { label: "가격", href: "/pricing" },
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
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-2xl font-extrabold text-primary font-display">
                Phos AI
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              AI 기반 이미지 보정, 편집, 생성 도구
            </p>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-base font-bold text-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
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

        {/* Contact section */}
        <div className="mt-10 pt-6 border-t border-border">
          <h4 className="text-base font-bold text-foreground mb-3">문의</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Mail className="w-4 h-4 shrink-0" />
            <a
              href="mailto:support@anelo.kr"
              className="hover:text-foreground transition-colors"
            >
              support@anelo.kr
            </a>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground/70">
            <p>상호명 anelo | 대표 성재훈</p>
            <p>주소 경기도 수원시 영통구 광교마을로 156</p>
            <p>대표전화 031-235-0447</p>
            <p>사업자등록번호 264-40-01235 | 통신판매업신고 2026-수원영통-0035</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Anelo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

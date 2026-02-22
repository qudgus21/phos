"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { LoginModal } from "@/components/ui/login-modal";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "이미지 편집", href: "/image-edit" },
  { label: "피부 보정", href: "/upscale" },
  { label: "얼굴 변경", href: "/face-edit" },
  { label: "가격", href: "/pricing" },
];

/* ── D: 스크롤 프로그레스 + 컴팩트 모드 ── */
function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollHeight > 0) {
        setProgress(Math.min(currentScrollY / scrollHeight, 1));
      }

      setScrolled(currentScrollY > 50);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { scrolled, progress };
}

/* ── C: 모바일 메뉴 stagger 애니메이션 ── */
const mobileMenuVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const mobileItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.1 } },
};

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();
  const { scrolled, progress } = useNavScroll();

  /* C: 모바일 메뉴 열림 시 body 스크롤 잠금 */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className={cn(
          "glass-nav px-6 lg:px-16 xl:px-24 flex items-center justify-between transition-all duration-300",
          scrolled ? "py-3" : "py-4"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-400">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-foreground leading-tight font-display tracking-tight">
              Phos AI
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight tracking-widest uppercase hidden sm:block">
              Studio quality. Single click.
            </span>
          </div>
        </Link>

        {/* Desktop Nav — E: 활성 상태 표시 */}
        <div
          className="hidden md:flex items-center gap-2"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2.5 text-[15px] font-semibold transition-colors",
                  isActive ? "text-white" : "text-slate-300 hover:text-white"
                )}
                onMouseEnter={() => setHoveredHref(item.href)}
              >
                {item.label}
                {(hoveredHref === item.href ||
                  (isActive && hoveredHref === null)) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-1.5 right-1.5 -bottom-0.5 h-0.5 bg-primary rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <button
          onClick={() => setLoginOpen(true)}
          className="hidden md:inline-flex items-center px-6 py-2.5 text-[15px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl hover:brightness-110 transition-all cursor-pointer"
        >
          로그인하기
        </button>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </nav>

      {/* D: 스크롤 프로그레스 바 */}
      <div className="h-[2px] w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary will-change-transform"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: "left",
          }}
        />
      </div>

      {/* C: 모바일 백드롭 오버레이 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden -z-10"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* C: 모바일 메뉴 — stagger + 48px 터치 타겟 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden mx-4 mt-2 rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/30"
          >
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 flex flex-col gap-1"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div key={item.href} variants={mobileItemVariants}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 text-[15px] font-semibold rounded-xl transition-colors min-h-[48px]",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div variants={mobileItemVariants}>
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    className="w-full text-center px-5 py-3 text-[15px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl cursor-pointer min-h-[48px]"
                    onClick={() => {
                      setMobileOpen(false);
                      setLoginOpen(true);
                    }}
                  >
                    로그인하기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LogOut, Zap, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginModal } from "@/components/ui/login-modal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { createClient } from "@/lib/supabase/client";
import { useCreditsBalance } from "@/hooks/use-credits";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { UserCreditInfo } from "@/lib/types/credits";
import type { Dictionary } from "@/lib/i18n";

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "text-slate-500 dark:text-slate-400 bg-slate-500/15" },
  basic: { label: "Basic", className: "text-blue-400 bg-blue-500/15" },
  pro: { label: "Pro", className: "text-violet-400 bg-violet-500/15" },
  premium: { label: "Premium", className: "text-amber-300 bg-amber-400/15 ring-1 ring-amber-400/30" },
};

function PlanBadge({ planId, planName }: { planId: string; planName: string }) {
  const style = PLAN_BADGE[planId] ?? PLAN_BADGE.free;
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide", style.className)}>
      {style.label || planName}
    </span>
  );
}

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
      } else {
        setProgress(0);
      }

      setScrolled(currentScrollY > 50);
      ticking = false;
    };

    // 페이지 이동 시 초기 상태 반영
    update();

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

interface NavigationProps {
  dict: Dictionary;
  locale: string;
}

export function Navigation({ dict, locale }: NavigationProps) {
  const navItems = [
    { label: dict.nav.imageEdit, href: `/${locale}/image-edit` },
    { label: dict.nav.skinRetouch, href: `/${locale}/retouching` },
    { label: dict.nav.faceEdit, href: `/${locale}/face-edit` },
    { label: dict.nav.pricing, href: `/${locale}/pricing` },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { scrolled, progress } = useNavScroll();
  const queryClient = useQueryClient();
  const { data: creditInfo = null } = useCreditsBalance(!!user);

  /* 페이지 전환 완료 시 상태 리셋 */
  useEffect(() => {
    setHoveredHref(null);
    setClickedHref(null);
  }, [pathname]);

  const supabase = useMemo(() => createClient(), []);

  /* Auth state listener */
  useEffect(() => {
    // 서버에서 유저 정보 검증 (JWT 유효성 + DB 존재 여부)
    supabase.auth.getUser().then(({ data: { user: u }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(u);
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 크레딧 변동 이벤트 수신 (낙관적 업데이트) */
  useEffect(() => {
    const handler = (e: Event) => {
      const { total, delta, refresh } = (e as CustomEvent).detail;
      if (refresh) {
        queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance });
        return;
      }
      queryClient.setQueryData<UserCreditInfo>(queryKeys.credits.balance, (prev) => {
        if (!prev) return prev;
        const newTotal = delta != null
          ? Math.max(0, prev.balance.total + delta)
          : total;
        return { ...prev, balance: { ...prev.balance, total: newTotal } };
      });
    };
    window.addEventListener("credits-updated", handler);
    return () => window.removeEventListener("credits-updated", handler);
  }, [queryClient]);

  /* 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = () => setDropdownOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.refresh();
  };

  /* C: 모바일 메뉴 열림 시 body 스크롤 잠금 */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // 유저 아바타 (소셜 로그인 시 프로필 이미지, 없으면 이니셜)
  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className={cn(
          "glass-nav px-6 lg:px-16 xl:px-24 flex items-center justify-between transition-all duration-300",
          scrolled ? "py-3 glass-nav-scrolled" : "py-4"
        )}
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-400">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-foreground leading-tight font-display tracking-tight">
              Phos AI
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight tracking-widest uppercase hidden sm:block">
              {dict.nav.tagline}
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
                  "relative px-4 py-2.5 text-[15px] font-semibold transition-colors whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onMouseEnter={() => !clickedHref && setHoveredHref(item.href)}
                onClick={() => {
                  setClickedHref(item.href);
                  setHoveredHref(null);
                }}
              >
                {item.label}
                {/* 클릭 시: 클릭한 탭에 즉시 표시 / 평소: hover 슬라이드 */}
                {clickedHref ? (
                  clickedHref === item.href && (
                    <span className="absolute left-1.5 right-1.5 -bottom-0.5 h-0.5 bg-primary rounded-full" />
                  )
                ) : (
                  (hoveredHref === item.href ||
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
                  )
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA / User Menu */}
        {!authReady ? (
          <div className="hidden md:block w-[100px]" />
        ) : user ? (
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector locale={locale} />
            <ThemeToggle />

            {/* 크레딧 뱃지 */}
            {creditInfo && (
              <Link
                href={`/${locale}/pricing`}
                className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-500/25 hover:border-indigo-400/40 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {creditInfo.balance.total.toLocaleString()}
                </span>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-indigo-300" />
                </span>
              </Link>
            )}

            {/* 구분선 */}
            <div className="w-px h-6 bg-border" />

            {/* 유저 프로필 드롭다운 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                )}
                <span className="text-sm text-muted-foreground font-medium max-w-[140px] truncate">
                  {user.email}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground break-all">{user.email}</p>
                      {creditInfo && (
                        <div className="mt-1">
                          <PlanBadge
                            planId={creditInfo.plan.id}
                            planName={creditInfo.plan.name}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {dict.nav.signOut}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector locale={locale} />
            <ThemeToggle />
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center px-6 py-2.5 text-[15px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl hover:brightness-110 transition-all cursor-pointer"
            >
              {dict.nav.signIn}
            </button>
          </div>
        )}

        {/* Mobile: 크레딧 뱃지 + 햄버거 */}
        <div className="md:hidden flex items-center gap-2">
          {user && creditInfo && (
            <Link
              href={`/${locale}/pricing`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-500/25"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-foreground tabular-nums max-w-[80px] truncate">
                {creditInfo.balance.total.toLocaleString()}
              </span>
              <Plus className="w-3 h-3 text-indigo-400" />
            </Link>
          )}
          <button
            className="p-2 text-foreground cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={dict.nav.toggleMenu}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
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
                <div className="flex justify-center items-center gap-3 mt-2">
                  <LanguageSelector locale={locale} />
                  <ThemeToggle />
                </div>
              </motion.div>
              {authReady && (
              <motion.div variants={mobileItemVariants}>
                <div className="mt-3 pt-3 border-t border-border">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 px-4 py-2">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                            {userInitial}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-muted-foreground font-medium break-all">{user.email}</span>
                          {creditInfo && (
                            <span className="mt-0.5">
                              <PlanBadge
                                planId={creditInfo.plan.id}
                                planName={creditInfo.plan.name}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer min-h-[48px]"
                        onClick={() => {
                          setMobileOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        {dict.nav.signOut}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="w-full text-center px-5 py-3 text-[15px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl cursor-pointer min-h-[48px]"
                      onClick={() => {
                        setMobileOpen(false);
                        setLoginOpen(true);
                      }}
                    >
                      {dict.nav.signIn}
                    </button>
                  )}
                </div>
              </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}

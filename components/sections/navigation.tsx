"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LogOut, Zap, Plus } from "lucide-react";
import { LoginModal } from "@/components/ui/login-modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { UserCreditInfo } from "@/lib/types/credits";

const navItems = [
  { label: "이미지 편집", href: "/image-edit" },
  { label: "피부 보정", href: "/retouching" },
  { label: "얼굴 변경", href: "/face-edit" },
  { label: "가격", href: "/pricing" },
];

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "text-slate-400 bg-slate-500/15" },
  basic: { label: "Basic", className: "text-blue-400 bg-blue-500/15" },
  deluxe: { label: "Deluxe", className: "text-violet-400 bg-violet-500/15" },
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
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creditInfo, setCreditInfo] = useState<UserCreditInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { scrolled, progress } = useNavScroll();

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

  /* 로그인 시 크레딧 정보 fetch */
  useEffect(() => {
    if (!user) {
      setCreditInfo(null);
      return;
    }
    fetch("/api/credits/balance")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCreditInfo(json.data);
      })
      .catch(() => {});
  }, [user]);

  /* 크레딧 변동 이벤트 수신 (낙관적 업데이트) */
  useEffect(() => {
    const handler = (e: Event) => {
      const { total } = (e as CustomEvent).detail;
      setCreditInfo((prev) =>
        prev ? { ...prev, balance: { ...prev.balance, total } } : prev
      );
    };
    window.addEventListener("credits-updated", handler);
    return () => window.removeEventListener("credits-updated", handler);
  }, []);

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
            {/* 크레딧 뱃지 */}
            {creditInfo && (
              <Link
                href="/pricing"
                className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-500/25 hover:border-indigo-400/40 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white tabular-nums">
                  {creditInfo.balance.total.toLocaleString()}
                </span>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-indigo-300" />
                </span>
              </Link>
            )}

            {/* 구분선 */}
            <div className="w-px h-6 bg-white/10" />

            {/* 유저 프로필 드롭다운 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                )}
                <span className="text-sm text-slate-300 font-medium max-w-[140px] truncate">
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
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#1e2040] shadow-2xl shadow-black/40 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      <div className="mt-1">
                        <PlanBadge
                          planId={creditInfo?.plan.id ?? "free"}
                          planName={creditInfo?.plan.name ?? "Free"}
                        />
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLoginOpen(true)}
            className="hidden md:inline-flex items-center px-6 py-2.5 text-[15px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl hover:brightness-110 transition-all cursor-pointer"
          >
            로그인하기
          </button>
        )}

        {/* Mobile: 크레딧 뱃지 */}
        {user && creditInfo && (
          <Link
            href="/pricing"
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-500/25"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-white tabular-nums">
              {creditInfo.balance.total.toLocaleString()}
            </span>
          </Link>
        )}
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
                          <span className="text-sm text-slate-300 font-medium truncate">{user.email}</span>
                          <span className="mt-0.5">
                            <PlanBadge
                              planId={creditInfo?.plan.id ?? "free"}
                              planName={creditInfo?.plan.name ?? "Free"}
                            />
                          </span>
                        </div>
                      </div>
                      <button
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/8 transition-colors cursor-pointer min-h-[48px]"
                        onClick={() => {
                          setMobileOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
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
                      로그인하기
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

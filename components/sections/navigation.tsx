"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { LoginModal } from "@/components/ui/login-modal";

const navItems = [
  { label: "이미지 편집", href: "/image-edit" },
  { label: "얼굴 변경", href: "/face-edit" },
  { label: "피부 보정", href: "/upscale" },
  { label: "컨셉 스토어", href: "/studio" },
  { label: "가격", href: "/pricing" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass-nav px-6 lg:px-16 xl:px-24 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-400">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-foreground leading-tight font-display tracking-tight">
              Revoa AI
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight tracking-widest uppercase hidden sm:block">
              Studio quality. Single click.
            </span>
          </div>
        </Link>

        {/* Desktop Nav — center */}
        <div
          className="hidden md:flex items-center gap-2"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-4 py-2.5 text-[15px] font-semibold text-slate-300 hover:text-white transition-colors"
              onMouseEnter={() => setHoveredHref(item.href)}
            >
              {item.label}
              {hoveredHref === item.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-1.5 right-1.5 -bottom-0.5 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <button
          onClick={() => setLoginOpen(true)}
          className="hidden md:inline-flex items-center px-6 py-2.5 text-[15px] font-bold text-primary-foreground bg-primary rounded-xl hover:brightness-110 transition-all cursor-pointer"
        >
          로그인하기
        </button>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mx-4 mt-2 rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  className="w-full text-center px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginOpen(true);
                  }}
                >
                  로그인하기
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}

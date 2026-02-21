"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "홈", href: "/" },
  { label: "AI수업", href: "/ai-class" },
];

const navLinksRight = [
  { label: "가격", href: "/pricing" },
  { label: "로그인하기", href: "/login" },
];

const aiFeatures = [
  { label: "보정", href: "/upscale" },
  { label: "이미지 편집", href: "/image-edit" },
  { label: "얼굴 변경", href: "/face-edit" },
  { label: "컨셉 스토어", href: "/studio" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass-nav mx-4 lg:mx-auto mt-3 max-w-6xl rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
        {/* Logo + Theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-foreground leading-tight font-display">
                Refine AI
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground leading-tight tracking-widest uppercase hidden sm:block">
                BETTER VISUALS, FASTER DECISIONS
              </span>
            </div>
          </Link>
          <ThemeToggle className="hidden md:flex" />
        </div>

        {/* Desktop Nav — centered-right */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}

          {/* AI 기능 Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer"
            >
              <span>AI 기능</span>
              <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full">
                4개 기능
              </span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-muted-foreground/60 transition-transform",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 w-44 rounded-xl border border-border bg-card shadow-elevated p-2"
                >
                  {aiFeatures.map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      {f.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinksRight.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </div>

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
              {[...navLinks, ...navLinksRight].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                AI 기능
              </div>
              {aiFeatures.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {f.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-border">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

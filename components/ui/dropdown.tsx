"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  variant?: "default" | "gradient";
  openDirection?: "auto" | "above" | "below";
  columns?: number;
  align?: "left" | "right";
}

export function Dropdown({
  options,
  value,
  onChange,
  className,
  placeholder = "선택",
  variant = "default",
  openDirection = "auto",
  columns = 1,
  align = "left",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  /* ── 외부 클릭으로 닫기 ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── 열릴 때 현재 선택 항목에 포커스 인덱스 맞추기 ── */
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  /* ── 포커스 인덱스 변경 시 스크롤 ── */
  useEffect(() => {
    if (!open || focusIndex < 0) return;
    const item = listRef.current?.children[focusIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusIndex, open]);

  /* ── 키보드 핸들러 ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < options.length) {
            onChange(options[focusIndex].value);
            setOpen(false);
          }
          break;
      }
    },
    [open, focusIndex, options, onChange]
  );

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  /* ── 메뉴 위/아래 방향 결정 ── */
  const getMenuPosition = () => {
    if (!containerRef.current) return "below";
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(options.length * 32 + 8, 208);
    return spaceBelow < menuHeight && rect.top > menuHeight ? "above" : "below";
  };

  const direction = open
    ? openDirection === "auto" ? getMenuPosition() : openDirection
    : "below";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center justify-between gap-1.5 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-all duration-200 cursor-pointer",
          variant === "gradient"
            ? "bg-gradient-to-r from-primary/30 to-secondary/25 border-primary/50 text-foreground hover:from-primary/40 hover:to-secondary/35 hover:border-[#A5B4FC]/60 focus:ring-1 focus:ring-primary/50"
            : "bg-muted border-border text-foreground hover:border-[#A5B4FC]/40 hover:bg-[#A5B4FC]/10 focus:ring-1 focus:ring-primary/40 focus:border-primary/40",
          open && (variant === "gradient" ? "ring-1 ring-primary/50" : "ring-1 ring-primary/40 border-primary/40")
        )}
      >
        <span className="grid items-center text-left">
          {options.map((opt) => (
            <span
              key={opt.value}
              className={cn(
                "col-start-1 row-start-1 whitespace-nowrap pointer-events-none",
                opt.value !== value && "invisible",
                variant === "gradient" && "bg-gradient-to-r from-[#A5B4FC] to-[#67E8F9] bg-clip-text text-transparent font-semibold"
              )}
            >
              {opt.label}
            </span>
          ))}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            variant === "gradient" ? "text-primary" : "text-muted-foreground",
            open && "rotate-180"
          )}
        />
      </button>

      {/* ── Menu ── */}
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: direction === "above" ? 4 : -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "above" ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[9999] min-w-[100px] rounded-lg border border-border bg-card py-1 shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.55)]",
              columns === 1 ? "w-full max-h-52 overflow-y-auto" : "w-max",
              direction === "above" ? "bottom-full mb-1" : "top-full mt-1",
              align === "right" ? "right-0" : "left-0"
            )}
            style={columns > 1 ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setFocusIndex(i)}
                onMouseLeave={() => setFocusIndex(-1)}
                onClick={() => select(opt.value)}
                className={cn(
                  "px-2.5 py-1.5 text-sm cursor-pointer transition-colors hover:bg-muted",
                  opt.value === value
                    ? "bg-muted text-foreground font-medium"
                    : "text-card-foreground"
                )}
              >
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

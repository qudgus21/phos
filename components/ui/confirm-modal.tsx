"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-context";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
}: ConfirmModalProps) {
  const dict = useDictionary();
  const resolvedTitle = title ?? dict.common.confirmModal.defaultTitle;
  const resolvedDescription = description ?? dict.common.confirmModal.defaultDescription;
  const resolvedConfirmLabel = confirmLabel ?? dict.common.confirmModal.confirmLabel;
  const resolvedCancelLabel = cancelLabel ?? dict.common.confirmModal.cancelLabel;
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onConfirm, onClose]);

  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[380px] mx-4 rounded-2xl bg-gradient-to-b from-[#2f3363] to-[#282b52] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Top accent bar */}
            <div
              className={
                isDanger
                  ? "h-0.5 bg-gradient-to-r from-red-500 to-rose-500"
                  : "h-0.5 bg-gradient-to-r from-indigo-500 via-violet-400 to-purple-500"
              }
            />

            <div className="relative px-7 pt-6 pb-7">
              {/* Glow */}
              <div
                className={
                  isDanger
                    ? "absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-red-500/15 blur-3xl rounded-full pointer-events-none"
                    : "absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-indigo-400/15 blur-3xl rounded-full pointer-events-none"
                }
              />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div
                  className={
                    isDanger
                      ? "flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 shadow-lg shadow-red-500/25"
                      : "flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/25"
                  }
                >
                  {isDanger ? (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg font-extrabold text-white tracking-tight mt-4">
                  {resolvedTitle}
                </h2>

                {/* Description */}
                <div className="text-sm text-slate-300 mt-3.5 leading-relaxed">
                  {resolvedDescription}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 w-full mt-6">
                  {resolvedCancelLabel && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 py-3 text-sm font-semibold text-slate-300 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
                    >
                      {resolvedCancelLabel}
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={
                      isDanger
                        ? "flex-1 py-3 text-sm font-extrabold text-white rounded-xl bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_16px_rgba(239,68,68,0.35)] hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] hover:brightness-110 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                        : "flex-1 py-3 text-sm font-extrabold text-white rounded-xl bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] hover:brightness-110 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                    }
                  >
                    {resolvedConfirmLabel}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

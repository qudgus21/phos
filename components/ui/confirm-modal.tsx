"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "확인",
  description = "이 작업을 진행하시겠습니까?",
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onClose]);

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        {/* Icon */}
        <div
          className={
            variant === "danger"
              ? "w-11 h-11 rounded-full bg-error/15 flex items-center justify-center mb-4"
              : "w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center mb-4"
          }
        >
          <AlertTriangle
            className={
              variant === "danger"
                ? "w-5 h-5 text-error"
                : "w-5 h-5 text-primary"
            }
          />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {/* Actions */}
        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-semibold text-muted-foreground rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              variant === "danger"
                ? "flex-1 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] hover:brightness-110 transition-all duration-200 cursor-pointer"
                : "flex-1 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r from-primary to-secondary shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:brightness-110 transition-all duration-200 cursor-pointer"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

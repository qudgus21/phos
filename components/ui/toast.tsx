"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-success text-success-foreground",
  error: "bg-error text-error-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
};

const typeIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 shrink-0" />,
  info: <Info className="w-5 h-5 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timersRef.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 4000, action?: ToastAction) => {
      // 동일 메시지+타입이 이미 표시 중이면 무시
      setToasts((prev) => {
        if (prev.some((t) => t.message === message && t.type === type)) return prev;
        const id = crypto.randomUUID();
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
        return [...prev, { id, message, type, duration, action }];
      });
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-sm",
                typeStyles[t.type]
              )}
            >
              {typeIcons[t.type]}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{t.message}</span>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      removeToast(t.id);
                    }}
                    className="block text-xs opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity mt-0.5"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Close"
                className="p-0.5 rounded hover:bg-white/20 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

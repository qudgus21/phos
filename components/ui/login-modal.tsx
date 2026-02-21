"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Mail, Lock } from "lucide-react";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

const formVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "login" | "signup";

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>("login");

  const handleClose = () => {
    onClose();
    setTimeout(() => setMode("login"), 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[420px] mx-4 rounded-3xl bg-gradient-to-b from-[#2a2d4a] to-[#232540] shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-indigo-400 to-violet-500" />

            <div className="relative p-8 pt-7">
              {/* Subtle glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo & Header */}
              <div className="relative flex flex-col items-center mb-7">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" as const, stiffness: 300, damping: 25 }}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-400 mb-4 shadow-lg shadow-primary/25"
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
                  {mode === "login" ? "Revoa AI 로그인" : "Revoa AI 시작하기"}
                </h2>
                <p className="text-sm text-indigo-400 mt-1.5 font-medium">
                  {mode === "login"
                    ? "AI 보정의 새로운 기준을 경험하세요"
                    : "무료로 가입하고 시작하세요"}
                </p>
              </div>

              {/* Google Login Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-[15px] hover:bg-gray-50 hover:shadow-md transition-all shadow-sm cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5" />
                Google로 계속하기
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500 font-medium">또는</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-3"
                >
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-[15px] hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    {mode === "login" ? "로그인" : "가입하기"}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </AnimatePresence>

              {/* Toggle mode */}
              <p className="text-sm text-slate-400 text-center mt-6">
                {mode === "login" ? (
                  <>
                    아직 계정이 없으신가요?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      회원가입
                    </button>
                  </>
                ) : (
                  <>
                    이미 계정이 있으신가요?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      로그인
                    </button>
                  </>
                )}
              </p>

              {/* Terms */}
              <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
                계속 진행하면{" "}
                <span className="text-slate-400 underline underline-offset-2 cursor-pointer hover:text-indigo-400 transition-colors">
                  이용약관
                </span>
                {" "}및{" "}
                <span className="text-slate-400 underline underline-offset-2 cursor-pointer hover:text-indigo-400 transition-colors">
                  개인정보처리방침
                </span>
                에 동의하는 것으로 간주합니다.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Mail, Lock, Check, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.384C19.612 22.954 24 17.99 24 12Z"
        fill="white"
      />
    </svg>
  );
}

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

// 비밀번호 유효성 검증
const passwordRules = [
  { key: "length", label: "8 characters or more", test: (pw: string) => pw.length >= 8 },
  { key: "letter", label: "At least one letter", test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw: string) => /\d/.test(pw) },
] as const;

function isPasswordValid(password: string) {
  return passwordRules.every((r) => r.test(password));
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Supabase 에러 메시지 매핑
function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Invalid email or password.";
  if (message.includes("Email not confirmed")) return "Please verify your email first.";
  if (message.includes("User already registered")) return "This email is already registered.";
  if (message.includes("rate limit")) return "Too many attempts. Please try again later.";
  if (message.includes("Password should be at least")) return "Password must be at least 8 characters.";
  return message;
}

/* ── 공통 input 스타일 ── */
const inputBase =
  "w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#383b5e] border border-[#4e5283] text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-all";
const inputError =
  "w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#383b5e] border border-red-400/50 text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400/50 transition-all";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "login" | "signup" | "check-email";

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
    setResending(false);
    setSubmitted(false);
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMode("login");
      resetForm();
    }, 200);
  };

  // 클라이언트 유효성 검증 — submit 시에만
  const validate = (): string | null => {
    if (!email.trim()) return "Please enter your email address.";
    if (!isEmailValid(email)) return "Please enter a valid email address.";
    if (!password.trim()) return "Please enter your password.";
    if (mode === "signup" && !isPasswordValid(password)) return "Password doesn't meet the requirements below.";
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const msg = validate();
    if (msg) { setError(msg); return; }

    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (authError) {
      setError(mapAuthError(authError.message));
      return;
    }

    // 이미 가입된 이메일이면 identities가 빈 배열 (email enumeration protection)
    if (data.user && data.user.identities?.length === 0) {
      setError("This email is already registered. Try signing in with Google or Facebook.");
      return;
    }

    setMode("check-email");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const msg = validate();
    if (msg) { setError(msg); return; }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(mapAuthError(authError.message));
      return;
    }

    handleClose();
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  const handleResendEmail = async () => {
    setResending(true);
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setResending(false);
  };

  const handleSubmit = mode === "signup" ? handleSignUp : handleLogin;

  // 이메일/비밀번호 에러 상태 (submit 후에만)
  const emailHasError = submitted && (!email.trim() || !isEmailValid(email));
  const passwordHasError = submitted && !password.trim();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[420px] mx-4 rounded-3xl bg-gradient-to-b from-[#2f3363] to-[#282b52] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-400 to-purple-500" />

            <div className="relative p-8 pt-7">
              {/* Subtle glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-36 bg-indigo-400/20 blur-3xl rounded-full pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {mode === "check-email" ? (
                  /* ── Check Email Screen ── */
                  <motion.div
                    key="check-email"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative flex flex-col items-center text-center"
                  >
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 mb-5 shadow-lg shadow-emerald-500/25">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
                      Check your email
                    </h2>
                    <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-[300px]">
                      We sent a verification link to{" "}
                      <span className="text-indigo-300 font-semibold">{email}</span>.
                      <br />
                      Click the link to activate your account.
                    </p>

                    <button
                      onClick={handleResendEmail}
                      disabled={resending}
                      className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-slate-200 font-medium hover:bg-white/15 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                      {resending ? "Sending..." : "Resend email"}
                    </button>

                    <button
                      onClick={() => {
                        setMode("login");
                        resetForm();
                      }}
                      className="mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Back to sign in
                    </button>
                  </motion.div>
                ) : (
                  /* ── Login / Signup Form ── */
                  <motion.div
                    key={mode}
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative"
                  >
                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-7">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring" as const, stiffness: 300, damping: 25 }}
                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-400 mb-4 shadow-lg shadow-indigo-500/30"
                      >
                        <Sparkles className="w-7 h-7 text-white" />
                      </motion.div>
                      <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
                        {mode === "login" ? "Sign in to Phos" : "Get started with Phos"}
                      </h2>
                      <p className="text-sm text-indigo-300 mt-1.5 font-medium">
                        {mode === "login"
                          ? "The new standard for AI image editing"
                          : "Create your free account"}
                      </p>
                    </div>

                    {/* Social Login Buttons — login 모드에서만 표시 */}
                    {mode === "login" && (
                      <>
                        <div className="flex flex-col gap-2.5">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOAuth("google")}
                            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-[15px] hover:bg-gray-50 hover:shadow-md transition-all shadow-sm cursor-pointer"
                          >
                            <GoogleIcon className="w-5 h-5 shrink-0" />
                            <span className="flex-1 text-center pr-8">Continue with Google</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOAuth("facebook")}
                            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#1877F2] text-white font-semibold text-[15px] hover:bg-[#166AE0] hover:shadow-md transition-all shadow-sm cursor-pointer"
                          >
                            <FacebookIcon className="w-5 h-5 shrink-0" />
                            <span className="flex-1 text-center pr-8">Continue with Facebook</span>
                          </motion.button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                          <div className="flex-1 h-px bg-white/15" />
                          <span className="text-xs text-slate-400 font-medium">or</span>
                          <div className="flex-1 h-px bg-white/15" />
                        </div>
                      </>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-3">
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${emailHasError ? "text-red-400/70" : "text-indigo-300/50"}`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                          placeholder="Email address"
                          className={emailHasError ? inputError : inputBase}
                        />
                      </div>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${passwordHasError ? "text-red-400/70" : "text-indigo-300/50"}`} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                          placeholder="Password"
                          className={passwordHasError ? inputError : inputBase}
                        />
                      </div>

                      {/* Password hints (signup only) */}
                      {mode === "signup" && password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex flex-col gap-1.5 pt-1"
                        >
                          {passwordRules.map((rule) => {
                            const pass = rule.test(password);
                            return (
                              <div key={rule.key} className="flex items-center gap-2 text-xs">
                                <Check
                                  className={`w-3.5 h-3.5 ${pass ? "text-emerald-400" : "text-slate-500"}`}
                                />
                                <span className={pass ? "text-emerald-400" : "text-slate-400"}>
                                  {rule.label}
                                </span>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}

                      {/* Error message — submit 후에만 표시 */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/20 text-[13px] text-red-300 leading-snug"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        disabled={loading || (mode === "signup" && password.length > 0 && !isPasswordValid(password))}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-[15px] hover:brightness-110 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {mode === "login" ? "Sign in" : "Create account"}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </form>

                    {/* Toggle mode */}
                    <p className="text-sm text-slate-400 text-center mt-6">
                      {mode === "login" ? (
                        <>
                          Don&apos;t have an account?{" "}
                          <button
                            onClick={() => { setMode("signup"); setError(""); setSubmitted(false); }}
                            className="font-semibold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent hover:from-indigo-200 hover:to-violet-200 transition-all cursor-pointer"
                          >
                            Sign up
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <button
                            onClick={() => { setMode("login"); setError(""); setSubmitted(false); }}
                            className="font-semibold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent hover:from-indigo-200 hover:to-violet-200 transition-all cursor-pointer"
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </p>

                    {/* Terms */}
                    <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
                      By continuing, you agree to our{" "}
                      <Link href="/terms" className="text-slate-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-slate-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

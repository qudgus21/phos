"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Check, Loader2, ExternalLink, ArrowUp, ArrowDown, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCreditsBalance } from "@/hooks/use-credits";

type PricingTab = "monthly" | "onetime";

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  recommended?: boolean;
  features: string[];
  ctaText: string;
}

const monthlyPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 120,
    features: [
      "120 크레딧",
      "회원가입 시 120 크레딧 지급",
      "⏱️ 5분당 1회 생성 제한",
      "한 번에 1장 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
    ],
    ctaText: "현재 플랜",
  },
  {
    id: "basic",
    name: "Basic",
    price: 9,
    credits: 2000,
    features: [
      "2,000 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "고해상도 변환",
      "실시간 처리",
    ],
    ctaText: "시작하기",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    credits: 4400,
    recommended: true,
    features: [
      "4,400 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
    ],
    ctaText: "시작하기",
  },
  {
    id: "premium",
    name: "Premium",
    price: 29,
    credits: 7100,
    features: [
      "7,100 크레딧",
      "⚡ 생성 쿨타임 없음",
      "한 번에 4장까지 생성 가능",
      "AI 업스케일링",
      "피부보정(기본)",
      "피부보정(메이크업)",
      "고해상도 변환",
      "실시간 처리",
      "무제한 업로드",
      "베타기능(무료)",
    ],
    ctaText: "시작하기",
  },
];

interface CreditPack {
  price: number;
  credits: number;
  label: string;
}

const onetimePacks: CreditPack[] = [
  { price: 5, credits: 700, label: "700" },
  { price: 10, credits: 1500, label: "1,500" },
  { price: 15, credits: 2400, label: "2,400" },
  { price: 20, credits: 3300, label: "3,300" },
  { price: 30, credits: 5100, label: "5,100" },
];

// ── 모달 상태 ────────────────────────────────────────────
interface ModalState {
  open: boolean;
  title: string;
  description: string | React.ReactNode;
  confirmLabel: string;
  variant: "default" | "danger";
  onConfirm: () => void;
}

const MODAL_INITIAL: ModalState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "",
  variant: "default",
  onConfirm: () => {},
};

interface PricingCardsProps {
  activeTab: PricingTab;
}

export function PricingCards({ activeTab }: PricingCardsProps) {
  const { user, requireAuth, loginModal } = useRequireAuth();
  const { data: creditInfo } = useCreditsBalance(!!user);
  const queryClient = useQueryClient();
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(MODAL_INITIAL);
  const [resultModal, setResultModal] = useState<ModalState>(MODAL_INITIAL);

  const currentPlanId = creditInfo?.plan?.id ?? "free";
  const scheduledPlanId = creditInfo?.scheduledPlanId ?? null;

  const closeModal = useCallback(() => setModal(MODAL_INITIAL), []);
  const closeResultModal = useCallback(() => setResultModal(MODAL_INITIAL), []);

  // ── API 호출 ───────────────────────────────────────────
  async function executeCheckout(
    productType: "subscription" | "credit_pack",
    planId?: string,
    creditPackCredits?: number
  ) {
    setLoadingProduct(planId ?? String(creditPackCredits));

    // 롤백용 스냅샷
    const prevCreditInfo = queryClient.getQueryData(queryKeys.credits.balance);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          ...(planId && { planId }),
          ...(creditPackCredits && { creditPackCredits: String(creditPackCredits) }),
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else if (json.success && json.data?.upgraded) {
        // 낙관적 업데이트: 즉시 UI 반영
        const toPlan = monthlyPlans.find((p) => p.id === json.data.toPlan);
        if (toPlan && creditInfo) {
          const subBalance = creditInfo.balance.subscription;
          const periodGranted = creditInfo.plan.monthlyCredits;
          const used = Math.max(periodGranted - subBalance, 0);
          const newSubBalance = Math.max(toPlan.credits - used, 0);

          queryClient.setQueryData(queryKeys.credits.balance, {
            ...creditInfo,
            balance: {
              ...creditInfo.balance,
              subscription: newSubBalance,
              total: creditInfo.balance.onetime + newSubBalance,
            },
            plan: { ...creditInfo.plan, id: json.data.toPlan, name: toPlan.name, monthlyCredits: toPlan.credits, priceUsd: toPlan.price },
            scheduledPlanId: null,
          });
        }
        // Realtime이 DB 변경 감지 시 자동 갱신 (invalidate 안 함 — 낙관적 업데이트 보호)
        setResultModal({
          open: true,
          title: "업그레이드 완료!",
          description: (
            <div className="space-y-1">
              <p>{json.data.toPlan.toUpperCase()} 플랜이 활성화되었습니다.</p>
              <p>추가 크레딧이 즉시 반영되었습니다.</p>
              <p className="text-indigo-300">새로운 기능을 즐겨보세요!</p>
            </div>
          ),
          confirmLabel: "시작하기",
          variant: "default",
          onConfirm: () => {},
        });
      } else if (json.success && json.data?.downgraded) {
        // 낙관적 업데이트: scheduledPlanId만 반영 (크레딧/플랜 변경 없음)
        if (creditInfo) {
          queryClient.setQueryData(queryKeys.credits.balance, {
            ...creditInfo,
            scheduledPlanId: json.data.toPlan,
          });
        }
        setResultModal({
          open: true,
          title: "플랜 변경 예약 완료",
          description: (
            <div className="space-y-1">
              <p>다음 결제일부터 {json.data.toPlan.toUpperCase()} 플랜이 적용됩니다.</p>
              <p>현재 크레딧은 이번 주기 끝까지 그대로 사용하실 수 있습니다.</p>
            </div>
          ),
          confirmLabel: "확인",
          variant: "default",
          onConfirm: () => {},
        });
      } else {
        queryClient.setQueryData(queryKeys.credits.balance, prevCreditInfo);
        setResultModal({
          open: true,
          title: "오류",
          description: json.error?.message ?? "결제 처리에 실패했습니다.",
          confirmLabel: "확인",
          variant: "danger",
          onConfirm: () => {},
        });
      }
    } catch {
      queryClient.setQueryData(queryKeys.credits.balance, prevCreditInfo);
      setResultModal({
        open: true,
        title: "네트워크 오류",
        description: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        confirmLabel: "확인",
        variant: "danger",
        onConfirm: () => {},
      });
    } finally {
      setLoadingProduct(null);
    }
  }

  // ── 플랜 클릭 ──────────────────────────────────────────
  function handlePlanClick(planId: string) {
    if (currentPlanId !== "free" && planId !== currentPlanId) {
      const planOrder = ["basic", "pro", "premium"];
      const isUpgrade = planOrder.indexOf(planId) > planOrder.indexOf(currentPlanId);
      const targetPlan = monthlyPlans.find((p) => p.id === planId);

      if (isUpgrade) {
        const subBalance = creditInfo?.balance.subscription ?? 0;
        const periodGranted = creditInfo?.plan?.monthlyCredits ?? 0;
        const used = Math.max(periodGranted - subBalance, 0);
        const newCredits = Math.max((targetPlan?.credits ?? 0) - used, 0);

        setModal({
          open: true,
          title: "플랜 업그레이드",
          description: (
            <div className="space-y-3 text-left mt-1">
              <p className="text-[13px] text-slate-300">
                {planId === "basic" && "크레딧 걱정 없이 자유롭게 생성해보세요."}
                {planId === "pro" && "더 많은 크레딧과 고급 기능으로 작업 효율을 높여보세요."}
                {planId === "premium" && "최대 크레딧과 모든 기능을 제한 없이 사용하세요."}
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-2 px-3.5 rounded-lg bg-white/5">
                  <span className="text-slate-400 text-[13px]">이번 달 사용량</span>
                  <span className="text-white font-semibold text-[13px]">{used.toLocaleString()} 크레딧</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-indigo-300 text-[13px]">추가될 크레딧</span>
                  <span className="text-indigo-200 font-bold text-[13px]">+{newCredits.toLocaleString()} 크레딧</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                남은 기간 차액만 청구 · 결제일 변경 없음
              </p>
            </div>
          ),
          confirmLabel: "업그레이드",
          variant: "default",
          onConfirm: () => executeCheckout("subscription", planId),
        });
      } else {
        setModal({
          open: true,
          title: "플랜 다운그레이드",
          description: (
            <div className="space-y-2 text-left mt-1">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-[13px]">현재 크레딧은 이번 주기 끝까지 그대로 사용 가능</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarClock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-[13px]">다음 결제일부터 <strong className="text-white">{targetPlan?.name}</strong> 플랜 적용</span>
              </div>
            </div>
          ),
          confirmLabel: "변경 예약",
          variant: "danger",
          onConfirm: () => executeCheckout("subscription", planId),
        });
      }
      return;
    }

    executeCheckout("subscription", planId);
  }

  // ── 포털 ───────────────────────────────────────────────
  async function handlePortal() {
    setLoadingProduct("portal");
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success && json.data?.portalUrl) {
        window.open(json.data.portalUrl, "_blank");
      } else {
        setResultModal({
          open: true,
          title: "오류",
          description: json.error?.message ?? "포털 접속에 실패했습니다.",
          confirmLabel: "확인",
          variant: "danger",
          onConfirm: () => {},
        });
      }
    } catch {
      setResultModal({
        open: true,
        title: "네트워크 오류",
        description: "네트워크 오류가 발생했습니다.",
        confirmLabel: "확인",
        variant: "danger",
        onConfirm: () => {},
      });
    } finally {
      setLoadingProduct(null);
    }
  }

  // ── 크레딧 팩 탭 ──────────────────────────────────────
  if (activeTab === "onetime") {
    return (
      <>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key="onetime"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-[1000px] mx-auto px-4"
        >
          {onetimePacks.map((pack) => {
            const isLoading = loadingProduct === String(pack.credits);
            return (
              <motion.div
                key={pack.price}
                variants={fadeInUp}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 lg:p-7 opacity-90 hover:opacity-100 transition-opacity"
              >
                <p className="text-4xl font-black text-primary tabular-nums leading-tight mb-3">
                  ${pack.price}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {pack.label} 크레딧
                </p>
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requireAuth(() => executeCheckout("credit_pack", undefined, pack.credits))
                  }
                  className={cn(
                    "w-full py-3 rounded-xl text-base font-bold transition-all cursor-pointer",
                    "bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110 btn-glow",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "구매하기"}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
        {loginModal}
      </>
    );
  }

  // ── 월간 구독 탭 ──────────────────────────────────────
  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        key="monthly"
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1200px] mx-auto px-4"
      >
        {monthlyPlans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isFree = plan.id === "free";
          const isLoading = loadingProduct === plan.id;
          const isPortalLoading = loadingProduct === "portal";

          const planOrder = ["free", "basic", "pro", "premium"];
          const isUpgradeTarget = !isFree && !isCurrentPlan && currentPlanId !== "free"
            && planOrder.indexOf(plan.id) > planOrder.indexOf(currentPlanId);
          const isDowngradeTarget = !isFree && !isCurrentPlan && currentPlanId !== "free"
            && planOrder.indexOf(plan.id) < planOrder.indexOf(currentPlanId);

          return (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              className={cn(
                "relative flex flex-col h-full rounded-2xl border bg-card p-6 lg:p-7",
                plan.recommended
                  ? "pricing-recommended"
                  : "border-border opacity-90 hover:opacity-100"
              )}
            >
              {plan.recommended && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <Badge variant="primary" className="absolute -top-3 right-5 bg-primary text-white">
                    추천
                  </Badge>
                </>
              )}

              {isCurrentPlan && !isFree && (
                <Badge className="absolute -top-3 left-5 bg-emerald-500 text-white">
                  현재 플랜
                </Badge>
              )}

              {scheduledPlanId === plan.id && !isCurrentPlan && (
                <Badge className="absolute -top-3 left-5 bg-amber-500 text-white">
                  다음 달부터 적용
                </Badge>
              )}

              <h3 className="text-h4 font-bold text-foreground mb-3">{plan.name}</h3>

              <p className="text-5xl font-black text-primary tabular-nums leading-tight mb-6">
                ${plan.price}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
              {isFree ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-base font-bold bg-muted text-muted-foreground cursor-not-allowed"
                >
                  {isCurrentPlan ? "현재 플랜" : "기본 플랜"}
                </button>
              ) : isCurrentPlan ? (
                <button
                  disabled={isPortalLoading}
                  onClick={() => handlePortal()}
                  className="w-full py-3 rounded-xl text-base font-bold transition-all cursor-pointer border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2"
                >
                  {isPortalLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      구독 관리
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled={isLoading}
                  onClick={() => requireAuth(() => handlePlanClick(plan.id))}
                  className={cn(
                    "w-full py-3 rounded-xl text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                    isDowngradeTarget
                      ? "border border-border text-muted-foreground hover:bg-muted/50"
                      : "bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:brightness-110 btn-glow",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isUpgradeTarget ? (
                    <>
                      <ArrowUp className="w-4 h-4" />
                      업그레이드
                    </>
                  ) : isDowngradeTarget ? (
                    <>
                      <ArrowDown className="w-4 h-4" />
                      다운그레이드
                    </>
                  ) : (
                    plan.ctaText
                  )}
                </button>
              )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <ConfirmModal
        open={modal.open}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        variant={modal.variant}
      />

      <ConfirmModal
        open={resultModal.open}
        onClose={closeResultModal}
        onConfirm={resultModal.onConfirm}
        title={resultModal.title}
        description={resultModal.description}
        confirmLabel={resultModal.confirmLabel}
        cancelLabel=""
        variant={resultModal.variant}
      />

      {loginModal}
    </>
  );
}

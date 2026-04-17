"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCreditsRealtime } from "@/hooks/use-credits-realtime";
import { useDictionary, useLocale } from "@/lib/i18n/dictionary-context";
import { PricingHeader } from "@/components/sections/pricing/pricing-header";
import { PricingCards } from "@/components/sections/pricing/pricing-cards";
import { PricingFaq } from "@/components/sections/pricing/pricing-faq";

type PricingTab = "monthly" | "onetime";

function CheckoutSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledSuccess = useRef(false);
  const dict = useDictionary();
  const locale = useLocale();

  const isSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (isSuccess && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      router.replace(`/${locale}/pricing`);
    }
  }, [isSuccess, router]);

  if (!isSuccess) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center py-3 text-sm font-medium">
      {dict.pricing.paymentSuccess}
    </div>
  );
}

export default function PricingContent() {
  const [activeTab, setActiveTab] = useState<PricingTab>("monthly");
  const { user } = useRequireAuth();

  // Realtime: user_credits / user_subscriptions 변경 시 자동 갱신
  useCreditsRealtime(user?.id);

  return (
    <div className="min-h-screen bg-background relative">
      <Suspense>
        <CheckoutSuccessBanner />
      </Suspense>
      <PricingHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <PricingCards activeTab={activeTab} />
      <PricingFaq />
    </div>
  );
}

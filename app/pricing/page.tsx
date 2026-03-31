"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCreditsRealtime } from "@/hooks/use-credits-realtime";
import { Footer } from "@/components/sections/footer";
import { PricingHeader } from "@/components/sections/pricing/pricing-header";
import { PricingCards } from "@/components/sections/pricing/pricing-cards";
import { PricingFaq } from "@/components/sections/pricing/pricing-faq";
import { DiscordFab } from "@/components/sections/pricing/discord-fab";

type PricingTab = "monthly" | "onetime";

function CheckoutSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledSuccess = useRef(false);

  const isSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (isSuccess && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      router.replace("/pricing");
    }
  }, [isSuccess, router]);

  if (!isSuccess) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center py-3 text-sm font-medium">
      결제가 완료되었습니다! 크레딧이 곧 반영됩니다.
    </div>
  );
}

export default function PricingPage() {
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
      <Footer />
      <DiscordFab />
    </div>
  );
}

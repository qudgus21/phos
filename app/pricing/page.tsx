"use client";

import { useState } from "react";
import { Navigation } from "@/components/sections/navigation";
import { Footer } from "@/components/sections/footer";
import { PricingHeader } from "@/components/sections/pricing/pricing-header";
import { PricingCards } from "@/components/sections/pricing/pricing-cards";
import { PricingFaq } from "@/components/sections/pricing/pricing-faq";
import { DiscordFab } from "@/components/sections/pricing/discord-fab";

type PricingTab = "monthly" | "onetime";

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<PricingTab>("monthly");

  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <PricingHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <PricingCards activeTab={activeTab} />
      <PricingFaq />
      <Footer />
      <DiscordFab />
    </div>
  );
}

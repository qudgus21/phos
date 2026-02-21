import { Navigation } from "@/components/sections/navigation";
import { Hero } from "@/components/sections/hero";
import { BeforeAfter } from "@/components/sections/before-after";
import { Compare } from "@/components/sections/compare";
import { CtaSection } from "@/components/sections/cta-section";
import { SkinRealism } from "@/components/sections/skin-realism";
import { Pricing } from "@/components/sections/pricing";
import { Footer } from "@/components/sections/footer";
import { DiscordFab } from "@/components/sections/discord-fab";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <Hero />
      <BeforeAfter />
      <Compare />
      <CtaSection />
      <SkinRealism />
      <Pricing />
      <Footer />
      <DiscordFab />
    </div>
  );
}

import { Navigation } from "@/components/sections/navigation";
import { Hero } from "@/components/sections/hero";
import { Upscale } from "@/components/sections/upscale";
import { ImageEdit } from "@/components/sections/image-edit";
import { SkinRetouch } from "@/components/sections/skin-retouch";
import { FaceSwap } from "@/components/sections/face-swap";
import { SkinRealism } from "@/components/sections/skin-realism";
import { Pricing } from "@/components/sections/pricing";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <Hero />
      <SkinRetouch />
      <SkinRealism />
      <ImageEdit />
      <FaceSwap />
      <Upscale />
      <Pricing />
      <Footer />
    </div>
  );
}

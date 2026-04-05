import dynamic from "next/dynamic";
import { type Locale, getDictionary } from "@/lib/i18n";
import { Hero } from "@/components/sections/hero";

const ImageEdit = dynamic(() =>
  import("@/components/sections/image-edit").then((mod) => mod.ImageEdit)
);
const SkinRetouch = dynamic(() =>
  import("@/components/sections/skin-retouch").then((mod) => mod.SkinRetouch)
);
const FaceSwap = dynamic(() =>
  import("@/components/sections/face-swap").then((mod) => mod.FaceSwap)
);
const SkinRealism = dynamic(() =>
  import("@/components/sections/skin-realism").then((mod) => mod.SkinRealism)
);
const Upscale = dynamic(() =>
  import("@/components/sections/upscale").then((mod) => mod.Upscale)
);
const Pricing = dynamic(() =>
  import("@/components/sections/pricing").then((mod) => mod.Pricing)
);
const Footer = dynamic(() =>
  import("@/components/sections/footer").then((mod) => mod.Footer)
);

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <main className="min-h-screen bg-background relative">
      <Hero dict={dict} locale={locale} />
      <ImageEdit dict={dict} locale={locale} />
      <SkinRetouch dict={dict} locale={locale} />
      <FaceSwap dict={dict} locale={locale} />
      <SkinRealism dict={dict} locale={locale} />
      <Upscale dict={dict} locale={locale} />
      <Pricing dict={dict} locale={locale} />
      <Footer dict={dict} locale={locale} />
    </main>
  );
}

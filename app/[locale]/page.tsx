import { type Locale, getDictionary } from "@/lib/i18n";
import { Hero } from "@/components/sections/hero";
import { Upscale } from "@/components/sections/upscale";
import { ImageEdit } from "@/components/sections/image-edit";
import { SkinRetouch } from "@/components/sections/skin-retouch";
import { FaceSwap } from "@/components/sections/face-swap";
import { SkinRealism } from "@/components/sections/skin-realism";
import { Pricing } from "@/components/sections/pricing";
import { Footer } from "@/components/sections/footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-background relative">
      <Hero dict={dict} locale={locale} />
      <ImageEdit dict={dict} locale={locale} />
      <SkinRetouch dict={dict} locale={locale} />
      <FaceSwap dict={dict} locale={locale} />
      <SkinRealism dict={dict} locale={locale} />
      <Upscale dict={dict} locale={locale} />
      <Pricing dict={dict} locale={locale} />
      <Footer dict={dict} locale={locale} />
    </div>
  );
}

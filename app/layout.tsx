import type { Viewport } from "next";
import { headers } from "next/headers";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { organizationJsonLd, JsonLdScript } from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/PretendardVariable-latin.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0000-02AF, U+1E00-1EFF, U+2000-22FF, U+25A0-25FF, U+FB00-FB06, U+FEFF, U+FFFD",
    },
  ],
});

const pretendardKorean = localFont({
  src: [
    {
      path: "../public/fonts/PretendardVariable-korean.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard-kr",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
  declarations: [
    {
      prop: "unicode-range",
      value: "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF",
    },
  ],
});

const pretendardCjk = localFont({
  src: [
    {
      path: "../public/fonts/PretendardVariable-cjk.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard-cjk",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
  declarations: [
    {
      prop: "unicode-range",
      value: "U+2E80-2EFF, U+3000-303F, U+3040-30FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FF00-FFEF",
    },
  ],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = h.get("x-locale") || "en";
  const dir = h.get("x-dir") || "ltr";

  return (
    <html lang={locale} dir={dir as "ltr" | "rtl"} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://images.phos.studio" />
        <link
          rel="preconnect"
          href="https://ltqzuqvjbiecbjdqgjge.supabase.co"
        />
        <link rel="dns-prefetch" href="https://replicate.delivery" />
        <JsonLdScript data={organizationJsonLd()} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9FD9GNS4PH"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9FD9GNS4PH');
          `}
        </Script>
      </head>
      <body
        className={`${spaceGrotesk.variable} ${pretendard.variable} ${pretendardKorean.variable} ${pretendardCjk.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

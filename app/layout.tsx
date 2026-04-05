import type { Viewport } from "next";
import { headers } from "next/headers";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
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
      path: "../public/fonts/PretendardVariable.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
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
        <link
          rel="preconnect"
          href="https://ltqzuqvjbiecbjdqgjge.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://ltqzuqvjbiecbjdqgjge.supabase.co"
        />
        <link
          rel="preconnect"
          href="https://images.phos.studio"
        />
        <link
          rel="dns-prefetch"
          href="https://images.phos.studio"
        />
        <JsonLdScript data={organizationJsonLd()} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${pretendard.variable} font-sans antialiased`}
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

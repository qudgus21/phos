import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/toast";
import { Navigation } from "@/components/sections/navigation";
import "./globals.css";

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
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Phos AI — AI 보정 SaaS",
  description:
    "AI 기반 이미지 보정, 편집, 생성 도구. 초단위 디테일, 클릭 한 번으로 전문가 급.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${pretendard.variable} font-sans antialiased`}
      >
        <Navigation />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

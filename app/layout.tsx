import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
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
        <link rel="preconnect" href="https://replicate.delivery" />
        <link rel="dns-prefetch" href="https://replicate.delivery" />
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

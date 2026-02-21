import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revoa",
  description: "Created with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard Variable",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-space-grotesk)",
          "Space Grotesk",
          "Inter",
          "sans-serif",
        ],
      },
      fontSize: {
        "hero": ["64px", { lineHeight: "1.1", fontWeight: "900" }],
        "h2": ["48px", { lineHeight: "1.15", fontWeight: "900" }],
        "h3": ["40px", { lineHeight: "1.2", fontWeight: "900" }],
        "h4": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "subtitle": ["20px", { lineHeight: "1.5", fontWeight: "600" }],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(139, 92, 246, 0.4), 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        "glow-violet-sm": "0 0 10px rgba(139, 92, 246, 0.3)",
        "glow-violet-lg": "0 0 40px rgba(139, 92, 246, 0.4), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        "card-dark": "0 20px 50px rgba(0,0,0,0.4)",
        "card-light": "0 4px 24px rgba(0,0,0,0.08)",
        "card-hover-dark": "0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.08)",
        "card-hover-light": "0 8px 32px rgba(0,0,0,0.12)",
        "elevated": "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

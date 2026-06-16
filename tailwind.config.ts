import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A2E4A",
          50: "#EEF2F7",
          100: "#D6DEEA",
          800: "#1A2E4A",
          900: "#121F33",
        },
        brand: {
          DEFAULT: "#2B7CC1",
          light: "#4FA3E0",
          dark: "#1A2E4A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F6F9",
        },
        ink: {
          DEFAULT: "#1A2E4A",
          secondary: "#6B7280",
        },
        status: {
          disponivel: "#16A34A",
          negociacao: "#D97706",
          vendido: "#DC2626",
          pendente: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(26, 46, 74, 0.08), 0 1px 3px -1px rgba(26, 46, 74, 0.06)",
        "card-hover": "0 8px 24px -4px rgba(26, 46, 74, 0.14), 0 2px 6px -2px rgba(26, 46, 74, 0.08)",
        floating: "0 12px 32px -6px rgba(43, 124, 193, 0.35)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

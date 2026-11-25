import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          bg: "var(--color-canvas)",
          sidebar: "var(--color-sidebar)",
          sidebarHover: "var(--color-surface-hover)",
          card: "var(--color-surface-raised)",
          border: "var(--color-border-strong)",
          input: "var(--color-surface)",
          userMsg: "var(--color-surface)",
          accent: "var(--color-accent)",
          accentHover: "var(--color-accent-hover)",
          text: "var(--color-ink)",
          subtext: "var(--color-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;

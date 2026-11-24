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
          bg: "#212121",
          sidebar: "#171717",
          sidebarHover: "#202123",
          card: "#2f2f2f",
          border: "#3c3c3c",
          input: "#2f2f2f",
          userMsg: "#2f2f2f",
          accent: "#10a37f",
          accentHover: "#0e8c6d",
          text: "#ececec",
          subtext: "#b4b4b4",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#08080c",
        surface: { 1: "#0f1016", 2: "#161622", 3: "#1e1e2e" },
        border: "#2a2a3a",
        gold: { DEFAULT: "#c89b3c", light: "#dbb454", dim: "#8a6b29" },
        txt: { DEFAULT: "#e8e4dc", muted: "#7a7670" },
        up: "#5cb85c",
        down: "#d9534f",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["Crimson Pro", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

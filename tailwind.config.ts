import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Royal British Club palette
        racing: {
          DEFAULT: "#14432A", // British racing green
          deep: "#0E2E1D",
          light: "#1E5C3A",
        },
        oxblood: {
          DEFAULT: "#6E1F1B", // claret / oxblood
          light: "#8A2A24",
        },
        brass: {
          DEFAULT: "#B08D46",
          light: "#C9A85E",
          dark: "#8A6D34",
        },
        parchment: {
          DEFAULT: "#F4ECD8", // aged paper
          dark: "#E7DBBE",
          card: "#FBF6E9",
        },
        ink: {
          DEFAULT: "#2B2118",
          soft: "#5A4E3D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      boxShadow: {
        ledger: "0 1px 0 rgba(43,33,24,0.06), 0 12px 30px -18px rgba(14,46,29,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;

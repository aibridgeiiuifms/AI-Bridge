import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Palette A — IIUI Emerald & Academic Ivory
        brand: {
          DEFAULT: "#0F4C3A",
          dark: "#093528",
          deep: "#07231A",
          light: "#E6F0EC",
          border: "#C3DCD2",
        },
        navy: {
          DEFAULT: "#1E293B",
          dark: "#0F172A",
          muted: "#334155",
        },
        ivory: {
          DEFAULT: "#F8F7F4",
          stone: "#F1EFEA",
          border: "#E2DFD7",
        },
        brass: {
          DEFAULT: "#C88A2B",
          hover: "#B0761E",
          light: "#FDF6EA",
          border: "#EAD1A7",
        },
        // Remap legacy palette-* tokens to Palette A so existing admin/dashboard classes remain high-contrast
        palette: {
          haiti: "#0F172A",
          sienna: "#0F4C3A",
          sandy: "#C88A2B",
          cream: "#E2E8F0",
          ecru: "#F8F7F4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.045)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "ken-burns": "ken-burns 7s ease-out forwards",
        "fade-in": "fade-in 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

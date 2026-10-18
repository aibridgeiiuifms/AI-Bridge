import type { Config } from "tailwindcss";

const paletteScale = {
  50: "#F7F5E9",
  100: "#FAD8B9",
  200: "#FAD8B9",
  300: "#F5AA66",
  400: "#F5AA66",
  500: "#EF6959",
  600: "#EF6959",
  700: "#220F38",
  800: "#220F38",
  900: "#220F38",
  950: "#220F38",
};

const neutralScale = {
  50: "#F7F5E9",
  100: "#FAD8B9",
  200: "#FAD8B9",
  300: "#F5AA66",
  400: "#220F38",
  500: "#220F38",
  600: "#220F38",
  700: "#220F38",
  800: "#220F38",
  900: "#220F38",
  950: "#220F38",
};

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
        palette: {
          haiti: "#220F38",
          sienna: "#EF6959",
          sandy: "#F5AA66",
          cream: "#FAD8B9",
          ecru: "#F7F5E9",
        },
        white: "#F7F5E9",
        black: "#220F38",
        slate: neutralScale,
        gray: neutralScale,
        emerald: paletteScale,
        teal: paletteScale,
        amber: paletteScale,
        blue: paletteScale,
        indigo: paletteScale,
        purple: paletteScale,
        red: paletteScale,
        rose: paletteScale,
        pink: paletteScale,
        cyan: paletteScale,
        brand: paletteScale,
        gold: paletteScale,
      },
    },
  },
  plugins: [],
};
export default config;

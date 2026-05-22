import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e7ff",
          500: "#003366",
          600: "#002a55",
          700: "#001e3d",
        },
        accent: {
          500: "#007a33",
          600: "#005c26",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

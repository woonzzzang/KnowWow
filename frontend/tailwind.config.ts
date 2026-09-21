import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#68758b",
        line: "#dde4ef",
        canvas: "#f5f7fb",
        primary: {
          50: "#eef5ff",
          100: "#dbeaff",
          500: "#2878f0",
          600: "#1264df",
          700: "#0d4fb4"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(31, 53, 92, 0.07)",
      },
    },
  },
  plugins: [],
} satisfies Config;


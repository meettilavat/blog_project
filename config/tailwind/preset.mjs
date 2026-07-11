import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
const preset = {
  darkMode: "class",
  content: [],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1100px"
      }
    },
    extend: {
      screens: {
        micro: "360px",
        note: "544px",
        folio: "768px",
        ledger: "832px",
        project: "896px",
        document: "1152px",
        spread: "1280px",
        marginalia: "1600px"
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", ...defaultTheme.fontFamily.sans],
        serif: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono]
      },
      colors: {
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        card: "rgb(var(--card-rgb) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default preset;

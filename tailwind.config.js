/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Mono'", "monospace"],
        body: ["'Geist'", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0a0a0f",
          1: "#111118",
          2: "#18181f",
          3: "#22222c",
          4: "#2c2c38",
        },
        accent: {
          DEFAULT: "#6ee7b7",
          dim: "#34d399",
          muted: "#1a3d32",
        },
        warn: {
          DEFAULT: "#fbbf24",
          dim: "#d97706",
          muted: "#3d2e08",
        },
        danger: {
          DEFAULT: "#f87171",
          dim: "#ef4444",
          muted: "#3d1010",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a0",
          muted: "#44445a",
        },
        border: {
          DEFAULT: "#2a2a38",
          active: "#6ee7b7",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "gaze-ring": "gazeRing 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gazeRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(110, 231, 183, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(110, 231, 183, 0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

module.exports = config;

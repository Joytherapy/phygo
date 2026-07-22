/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        electric: {
          DEFAULT: "#4F7CFF",
          light: "#7B9DFF",
          dark: "#3A5FE0",
        },
        emerald: {
          DEFAULT: "#32D6A0",
          light: "#5EE5B8",
          dark: "#22B085",
        },
        ink: {
          DEFAULT: "#0B0D12",
          soft: "#14161C",
        },
        mist: {
          DEFAULT: "#F6F7F9",
          dark: "#EEF0F4",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "20px",
        xl3: "24px",
        xl4: "28px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(11, 13, 18, 0.04), 0 12px 32px rgba(11, 13, 18, 0.06)",
        lift: "0 8px 24px rgba(11, 13, 18, 0.06), 0 30px 60px rgba(11, 13, 18, 0.10)",
        softDark: "0 2px 8px rgba(0, 0, 0, 0.3), 0 20px 48px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(79, 124, 255, 0.14), 0 12px 40px rgba(79, 124, 255, 0.20)",
        glowEmerald: "0 0 0 1px rgba(50, 214, 160, 0.14), 0 12px 40px rgba(50, 214, 160, 0.20)",
      },
      backgroundImage: {
        "grad-hero":
          "radial-gradient(55% 45% at 50% 0%, rgba(79,124,255,0.12) 0%, rgba(50,214,160,0.07) 45%, rgba(255,255,255,0) 100%)",
        "grad-mesh":
          "linear-gradient(135deg, rgba(79,124,255,0.14) 0%, rgba(50,214,160,0.10) 100%)",
        "grad-line": "linear-gradient(90deg, rgba(79,124,255,0) 0%, #4F7CFF 30%, #32D6A0 70%, rgba(50,214,160,0) 100%)",
        noise: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-10px) translateX(6px)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(79,124,255,0.35)" },
          "70%": { boxShadow: "0 0 0 16px rgba(79,124,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(79,124,255,0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(4%, -6%) scale(1.06)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 9s ease-in-out infinite",
        pulseRing: "pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite",
        drift: "drift 14s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

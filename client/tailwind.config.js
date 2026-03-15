/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#04030b",
        surface: "rgba(255,255,255,0.05)",
        neon: "#8b45ff",
        accent: "#00e5ff",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 255, 255, 0.12), 0 24px 66px rgba(0,0,0,0.45)",
        soft: "0 24px 54px rgba(0, 0, 0, 0.36)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { "background-position": "-150% 0" },
          "100%": { "background-position": "150% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.6s ease-in-out infinite",
      },
      backgroundImage: {
        "futuristic": "radial-gradient(circle at 20% 20%, rgba(139, 69, 255, 0.42), transparent 55%), radial-gradient(circle at 80% 30%, rgba(0, 229, 255, 0.2), transparent 60%), radial-gradient(circle at 50% 80%, rgba(255, 47, 230, 0.18), transparent 65%)",
      },
    },
  },
  plugins: [],
};

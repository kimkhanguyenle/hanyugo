/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Duolingo-ish palette: warm green for success/progress, gold for streaks.
        brand: {
          green: "#58cc02",
          greenDark: "#46a302",
          gold: "#ffc800",
          blue: "#1cb0f6",
        },
      },
    },
  },
  plugins: [],
};

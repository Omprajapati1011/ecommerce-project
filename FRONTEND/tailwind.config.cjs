module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          50: "#edf6f4",
          100: "#d6ebe7",
          200: "#add7cf",
          300: "#84c3b7",
          400: "#5caf9f",
          500: "#3f9788",
          600: "#2f7a6f",
          700: "#275f58",
          800: "#214d48",
          900: "#1d3f3b",
        },
        brand: {
          50: "#edf6f4",
          100: "#d6ebe7",
          200: "#add7cf",
          300: "#84c3b7",
          400: "#5caf9f",
          500: "#3f9788",
          600: "#2f7a6f",
          700: "#163332", // Match sidebar dark green
          800: "#122a29",
          900: "#0e201f",
          tan: "#c9b88a", // Match sidebar accent gold/tan
        },
        "app-background": {
          light: "#f3ecdf",
          dark: "#0b1114",
        },
        "app-surface": {
          light: "#fff8ee",
          dark: "#151e22",
          darker: "#0b1114",
          border: "#1f2933",
        },
      },
      fontFamily: {
        sans: ["Jost", "sans-serif"],
        serif: ['"Tenor Sans"', "sans-serif"],
        accent: ["Urbanist", "sans-serif"],
      },
      boxShadow: {
        luxe: "0 22px 45px -12px rgba(47, 122, 111, 0.22)",
      },
    },
  },
  plugins: [],
};

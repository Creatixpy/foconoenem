/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        secondary: "var(--secondary)",
        "card-bg": "var(--card-bg)",
        "muted-bg": "var(--muted-bg)",
        "border-color": "var(--border-color)",
      },
    },
  },
  plugins: [],
};

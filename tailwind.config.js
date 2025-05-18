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
        "primary-light": "var(--primary-light)",
        secondary: "var(--secondary)",
        "card-bg": "var(--card-bg)",
        "muted-bg": "var(--muted-bg)",
        "border-color": "var(--border-color)",
        accent: "var(--accent)",
        "accent-light": "var(--accent-light)",
        success: "var(--success)",
        "success-light": "var(--success-light)",
        warning: "var(--warning)",
        "warning-light": "var(--warning-light)",
        danger: "var(--danger)",
        "danger-light": "var(--danger-light)",
      },
    },
  },
  safelist: [
    'bg-green-600',
    'bg-blue-600',
    'bg-yellow-600',
    'bg-red-600',
    'text-green-600',
    'text-blue-600',
    'text-yellow-600',
    'text-red-600',
  ],
  plugins: [],
};

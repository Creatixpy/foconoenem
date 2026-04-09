/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base semantic colors
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary palette
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },

        // Accent palette
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
        },

        // UI colors
        secondary: "var(--secondary)",
        "card-bg": "var(--card-bg)",
        "muted-bg": "var(--muted-bg)",
        "border-color": "var(--border-color)",

        // Semantic states
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
          50: "var(--color-success-50)",
          100: "var(--color-success-100)",
          500: "var(--color-success-500)",
          600: "var(--color-success-600)",
          700: "var(--color-success-700)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
          50: "var(--color-warning-50)",
          100: "var(--color-warning-100)",
          500: "var(--color-warning-500)",
          600: "var(--color-warning-600)",
          700: "var(--color-warning-700)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          light: "var(--danger-light)",
          50: "var(--color-danger-50)",
          100: "var(--color-danger-100)",
          500: "var(--color-danger-500)",
          600: "var(--color-danger-600)",
          700: "var(--color-danger-700)",
        },
      },

      // Typography
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },

      // Spacing (using CSS variables)
      spacing: {
        "header": "var(--header-height)",
      },

      // Border radius
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },

      // Box shadows
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
      },

      // Z-index scale
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
      },

      // Transitions
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
      },

      // Container
      maxWidth: {
        container: "var(--container-max)",
      },

      // Animations
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in-left": "slideInLeft 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.5s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  safelist: [
    // Status colors
    "bg-green-600",
    "bg-blue-600",
    "bg-yellow-600",
    "bg-red-600",
    "text-green-600",
    "text-blue-600",
    "text-yellow-600",
    "text-red-600",
    // Theme colors
    "text-foreground",
    "bg-card",
    "bg-card-bg",
    "bg-muted-bg",
    "border-border-color",
    // Primary shades
    "bg-primary",
    "bg-primary-light",
    "text-primary",
    "text-primary-dark",
    // Semantic states
    "bg-success",
    "bg-success-light",
    "text-success",
    "bg-warning",
    "bg-warning-light",
    "text-warning",
    "bg-danger",
    "bg-danger-light",
    "text-danger",
  ],
  plugins: [],
};

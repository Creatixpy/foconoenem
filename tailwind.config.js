/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          "on-brand": "var(--text-on-brand)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          hover: "var(--border-hover)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          active: "var(--brand-active)",
          soft: "var(--brand-soft)",
          strong: "var(--brand-strong)",
        },
        ai: {
          DEFAULT: "var(--ai)",
          hover: "var(--ai-hover)",
          soft: "var(--ai-soft)",
        },
        success: {
          DEFAULT: "var(--success)",
          hover: "var(--success-hover)",
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          hover: "var(--warning-hover)",
          soft: "var(--warning-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover: "var(--danger-hover)",
          soft: "var(--danger-soft)",
        },
      },

      // Typography
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
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
    "bg-bg",
    "bg-surface",
    "bg-surface-2",
    "border-border",
    "bg-brand",
    "bg-brand-soft",
    "text-brand",
    "text-text",
    "text-text-2",
    "text-text-3",
    "bg-success",
    "bg-success-soft",
    "text-success",
    "bg-warning",
    "bg-warning-soft",
    "text-warning",
    "bg-danger",
    "bg-danger-soft",
    "text-danger",
  ],
  plugins: [],
};

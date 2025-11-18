"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    setPrefersDark(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  const isLight = resolvedTheme === "light";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-0 bg-card-bg/90 px-4 py-2.5 text-sm font-semibold text-foreground shadow-xl backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card-bg"
      >
        {isLight ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
        <span className="hidden text-xs font-semibold uppercase tracking-wide text-foreground/70 sm:inline">
          {isLight ? "Modo escuro" : "Modo claro"}
        </span>
      </button>
    </div>
  );
}

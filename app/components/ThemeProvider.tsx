"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia && 
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    } catch (e) {
      console.error("Failed to get theme from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const applyTheme = (newTheme: Theme) => {
      let effectiveTheme = newTheme;
      
      if (newTheme === "system") {
        effectiveTheme = window.matchMedia && 
          window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? "dark" : "light";
      }
      
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    };
    
    applyTheme(theme);
    
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
    
    // Adicionar listener para mudanças de sistema se o tema for 'system'
    if (theme === "system") {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, mounted]);

  // Não renderizar nada até que o componente seja montado para evitar erros de hidratação
  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

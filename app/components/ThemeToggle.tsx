"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Se não estiver montado, renderize um div vazio para evitar erros de hidratação
  if (!mounted) {
    return <div></div>;
  }

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <button 
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="p-2.5 bg-card-bg border border-border-color rounded-full shadow-md hover:bg-muted-bg transition-colors"
        title={theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Definição de metadata deve ser movida para um arquivo separado em layout client component
const metadata = {
  title: "Foco no ENEM - Simulado de Redação",
  description:
    "Pratique sua redação para o ENEM com feedback baseado em inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    // Verificar se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Aplicar o data-theme ao documento
    document.documentElement.setAttribute("data-theme", theme);
    
    // Salvar a preferência do usuário
    if (theme) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <html lang="pt-BR" data-theme={theme}>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed bottom-4 right-4 z-10">
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 bg-muted-bg rounded-full shadow-md"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
        {children}
      </body>
    </html>
  );
}

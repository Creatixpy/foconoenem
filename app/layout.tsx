import { Geist, Geist_Mono } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ThemeToggle from "./components/ThemeToggle";
import Providers from "./providers";
import StructuredData from "./structured-data";

const siteTitle = "Foco no ENEM - Plataforma de Simulados e Redações";
const siteDescription =
  "Simule redações e questões do ENEM com feedback por IA, dashboards personalizados e notícias atualizadas.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://foconoenem.vercel.app"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://foconoenem.vercel.app",
    siteName: "Foco no ENEM",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/foconoenemicon.png",
        width: 512,
        height: 512,
        alt: "Foco no ENEM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: "@foconoenem",
    images: ["/foconoenemicon.png"],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="system">
      <head>
        <link rel="icon" href="/foconoenemicon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/foconoenemicon.png" />
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8449266040565561"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col bg-page-gradient text-foreground">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <ThemeToggle />
          <StructuredData />
        </Providers>
      </body>
    </html>
  );
}

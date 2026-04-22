import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./styles/index.css";
import Providers from "./providers";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteTitle = "Foco no ENEM - Plataforma de Simulados e Redações";
const siteDescription =
  "Simule redações e questões do ENEM com feedback por IA, dashboards personalizados e notícias atualizadas.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://foconoenem.vercel.app"
  ),
  title: {
    default: siteTitle,
    template: "%s | Foco no ENEM",
  },
  description: siteDescription,
  icons: {
    icon: [
      { url: "/foconoenemicon.png", type: "image/png", sizes: "512x512" },
      { url: "/foconoenemicon.png", rel: "shortcut icon" },
    ],
    apple: "/foconoenemicon.png",
  },
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
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F1E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isTelemetryEnabled =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL === "1";

  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="flex flex-col min-h-dvh">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          {isTelemetryEnabled && (
            <>
              <SpeedInsights debug={false} />
              <Analytics debug={false} mode="production" />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Metadata, Viewport } from "next";
import "./styles/index.css";
import { Header, Footer } from "./components/layout";
import { ThemeToggle } from "./components/ui";
import { CookieConsent, AdSenseLoader } from "./components/shared";
import Providers from "./providers";
import StructuredData from "./structured-data";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { themeScript } from "@/lib/contexts/ThemeContext";

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
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isTelemetryEnabled = process.env.NODE_ENV === "production";

  return (
    <html
      lang="pt-BR"
      data-theme="system"
      suppressHydrationWarning
    >
      <head>
        {/* Theme script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <meta name="google-adsense-account" content="ca-pub-8449266040565561" />
        <link
          rel="icon"
          href="/foconoenemicon.png"
          type="image/png"
          sizes="any"
        />
        <link rel="apple-touch-icon" href="/foconoenemicon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased`}
      >
        <Providers>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="skip-link"
          >
            Pular para o conteúdo principal
          </a>

          {/* Main layout wrapper */}
          <div className="flex min-h-screen flex-col">
            <Header />

            <main
              id="main-content"
              className="flex-1 pt-[4.5rem]"
            >
              {children}
            </main>

            <Footer />
          </div>

          {/* Floating elements */}
          <ThemeToggle />
          <CookieConsent />

          {/* SEO and analytics */}
          <StructuredData />
          <AdSenseLoader />

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

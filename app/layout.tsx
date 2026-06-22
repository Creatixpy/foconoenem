import { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./styles/index.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ConsentAwareTelemetry from "./components/privacy/ConsentAwareTelemetry";
import RebrandingBanner from "./components/shared/RebrandingBanner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const siteTitle = "AprovIA - Sua aprovação, potencializada por IA";
const siteDescription =
  "Redações, questões e evolução para o ENEM com inteligência artificial e feedback personalizado.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aproviaedu.vercel.app"
  ),
  title: {
    default: siteTitle,
    template: "%s | AprovIA",
  },
  description: siteDescription,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aproviaedu.vercel.app",
    siteName: "AprovIA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/favicon.svg",
        width: 48,
        height: 48,
        alt: "AprovIA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/favicon.svg"],
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
  colorScheme: "dark",
  themeColor: "#080A0F",
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
    <html lang="pt-BR" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <Script src="/cookie-consent-init.js" strategy="beforeInteractive" />
      </head>
      <body className="flex flex-col min-h-dvh">
        <RebrandingBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ConsentAwareTelemetry enabled={isTelemetryEnabled} />
      </body>
    </html>
  );
}

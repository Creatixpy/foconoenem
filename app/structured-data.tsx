import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://foconoenem.vercel.app";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Foco no ENEM",
  url: siteUrl,
  logo: `${siteUrl}/foconoenemicon.png`,
  description:
    "Plataforma gratuita para praticar redações e questões do ENEM com inteligência artificial, dashboards de desempenho e notícias atualizadas.",
  sameAs: ["https://twitter.com/foconoenem"],
  founder: "Foco no ENEM",
  email: "contato@foconoenem.com",
  areaServed: "BR",
  serviceType: ["Simulado de redação", "Simulado de questões", "Notícias educacionais"],
};

export default function StructuredData() {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

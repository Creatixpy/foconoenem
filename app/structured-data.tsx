import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://foconoenem.vercel.app";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "Organization"],
      "@id": `${siteUrl}#organization`,
      name: "Foco no ENEM",
      url: siteUrl,
      logo: `${siteUrl}/foconoenemicon.png`,
      description:
        "Plataforma gratuita para praticar redações e questões do ENEM com inteligência artificial, dashboards de desempenho e notícias atualizadas.",
      sameAs: ["https://twitter.com/foconoenem"],
      email: "mailto:contato@foconoenem.com",
      areaServed: "BR",
      serviceType: ["Simulado de redação", "Simulado de questões", "Notícias educacionais"],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "support",
          email: "contato@foconoenem.com",
          availableLanguage: ["pt-BR"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: "Foco no ENEM",
      publisher: { "@id": `${siteUrl}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/noticias/pesquisa?query={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}#app`,
      name: "Foco no ENEM",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: siteUrl,
      featureList: [
        "Correção automática de redações",
        "Simulados de questões personalizados",
        "Atualizações de notícias do ENEM",
      ],
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
        },
      ],
      publisher: { "@id": `${siteUrl}#organization` },
    },
  ],
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

import { createPageMetadata } from "@/lib/contracts/page-metadata";
import HomeHero from "./_components/home/HomeHero";
import HomeFeatures from "./_components/home/HomeFeatures";
import HomeHowItWorks from "./_components/home/HomeHowItWorks";
import HomeStart from "./_components/home/HomeStart";

export const metadata = createPageMetadata({
  title: "Simulados personalizados e redações com IA",
  description:
    "Construa sua rotina de estudos com simulados adaptados, correção de redação e insights para cada competência do ENEM.",
  pathname: "/",
});

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeStart />
    </>
  );
}

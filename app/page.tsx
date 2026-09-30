import type { Metadata } from "next";
import HomeHero from "./_components/home/HomeHero";
import HomeFeatures from "./_components/home/HomeFeatures";
import HomeHowItWorks from "./_components/home/HomeHowItWorks";
import HomeStart from "./_components/home/HomeStart";

export const metadata: Metadata = {
  title: "AprovIA - Simulados personalizados e redações com IA",
  description:
    "Construa sua rotina de estudos com simulados adaptados, correção de redação e insights para cada competência do ENEM.",
};

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

import { Metadata } from "next";
import NoticiasPageClient from "./NoticiasPageClient";

export const metadata: Metadata = {
  title: "Notícias e Atualizações ENEM – Foco no ENEM",
  description:
    "Resumos curtos sobre ENEM e educação para manter seu repertório atualizado. Prazos, temas e comunicados oficiais em um único lugar.",
};

export default function NoticiasPage() {
  return <NoticiasPageClient />;
}

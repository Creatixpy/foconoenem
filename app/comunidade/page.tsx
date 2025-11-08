import type { Metadata } from "next";
import CommunityPageClient from "./CommunityPageClient";

export const metadata: Metadata = {
  title: "Comunidade ENEM – Foco no ENEM",
  description:
    "Participe da comunidade privada do Foco no ENEM, troque repertórios, compartilhe dúvidas e acompanhe discussões moderadas sobre redação e simulados.",
};

export default function ComunidadePage() {
  return <CommunityPageClient />;
}

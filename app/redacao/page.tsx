import { Metadata } from "next";
import RedacaoPageClient from "./RedacaoPageClient";

export const metadata: Metadata = {
  title: "Simulado de Redação ENEM com IA – Foco no ENEM",
  description:
    "Envie sua redação, receba notas por competência e feedback imediato de inteligência artificial treinada no ENEM.",
};

export default function RedacaoPage() {
  return <RedacaoPageClient />;
}

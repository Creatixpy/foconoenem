import { Metadata } from "next";
import QuestoesPageClient from "./QuestoesPageClient";

export const metadata: Metadata = {
  title: "Simulado de Questões ENEM com IA – Foco no ENEM",
  description:
    "Crie blocos personalizados por disciplina e treine questões inéditas com explicações comentadas instantâneas.",
};

export default function QuestoesPage() {
  return <QuestoesPageClient />;
}

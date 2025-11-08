import { Metadata } from "next";
import dynamic from "next/dynamic";

const QuestoesPageClient = dynamic(() => import("./QuestoesPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <p className="text-base font-semibold text-foreground/80">Preparando o simulador inteligente...</p>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Simulado de Questões ENEM com IA – Foco no ENEM",
  description:
    "Crie blocos personalizados por disciplina e treine questões inéditas com explicações comentadas instantâneas.",
};

export default function QuestoesPage() {
  return <QuestoesPageClient />;
}

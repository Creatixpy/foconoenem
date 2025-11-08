import { Metadata } from "next";
import dynamic from "next/dynamic";

const RedacaoPageClient = dynamic(() => import("./RedacaoPageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <p className="text-base font-semibold text-foreground/80">Carregando o editor de redações...</p>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Simulado de Redação ENEM com IA – Foco no ENEM",
  description:
    "Envie sua redação, receba notas por competência e feedback imediato de inteligência artificial treinada no ENEM.",
};

export default function RedacaoPage() {
  return <RedacaoPageClient />;
}

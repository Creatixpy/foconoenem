import { Metadata } from "next";
import { Suspense } from "react";
import RedacaoPageClient from "./RedacaoPageClient";

export const metadata: Metadata = {
  title: "Simulado de Redação ENEM com IA – Foco no ENEM",
  description:
    "Envie sua redação, receba notas por competência e feedback imediato de inteligência artificial treinada no ENEM.",
};

export default function RedacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
          <p className="text-base font-semibold text-foreground/80">Carregando o editor de redações...</p>
        </div>
      }
    >
      <RedacaoPageClient />
    </Suspense>
  );
}

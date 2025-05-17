"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EssayResult } from "@/types";

export default function ResultadosPage() {
  const [result, setResult] = useState<EssayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resultados/${id}`);
        
        if (!response.ok) {
          throw new Error("Resultado não encontrado");
        }
        
        const data = await response.json();
        setResult(data.result);
      } catch (error) {
        console.error("Error fetching result:", error);
        setError("Não foi possível carregar o resultado. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  const getGradeColor = (grade: number) => {
    if (grade >= 800) return "text-green-600";
    if (grade >= 600) return "text-blue-600";
    if (grade >= 400) return "text-yellow-600";
    return "text-red-600";
  };

  const getCompetenceGradeColor = (grade: number) => {
    if (grade >= 160) return "text-green-600";
    if (grade >= 120) return "text-blue-600";
    if (grade >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="loader"></div>
        <p className="mt-4 text-gray-600">Carregando resultado...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-700 mb-6">{error || "Resultado não encontrado"}</p>
          <Link 
            href="/redacao" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded inline-block"
          >
            Voltar para o Simulado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Foco no ENEM</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/redacao" className="hover:underline">
                  Simulado
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            Resultado da sua Redação
          </h2>
          
          {/* Badge indicadora da origem da correção */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              result.origem === "IA" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
            }`}>
              {result.origem === "IA" ? "Correção por IA" : "Correção Simulada"}
            </span>
          </div>
          
          <div className="text-center py-6 mb-8 border-b border-gray-200">
            <p className="text-gray-600 mb-2">Sua nota final</p>
            <h3 className={`text-5xl font-bold mb-2 ${getGradeColor(result.nota)}`}>
              {result.nota}
            </h3>
            <p className="text-gray-600">de 1000 pontos</p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-800 mb-4">Feedback Geral</h3>
            <p className="bg-blue-50 p-4 rounded-lg">{result.feedbackGeral}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-4">Pontos Fortes</h3>
              <ul className="space-y-2">
                {result.pontoFortes.map((ponto, index) => (
                  <li key={`forte-${index}`} className="bg-green-50 p-3 rounded flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {ponto}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-600 mb-4">Pontos a Melhorar</h3>
              <ul className="space-y-2">
                {result.pontosAMelhorar.map((ponto, index) => (
                  <li key={`melhorar-${index}`} className="bg-amber-50 p-3 rounded flex items-start">
                    <span className="text-amber-500 mr-2">!</span>
                    {ponto}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-800 mb-4">Análise por Competências</h3>
            
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Competência 1: Domínio da norma culta</h4>
                    <span className={`font-bold ${getCompetenceGradeColor(result.competencia1.nota)}`}>
                      {result.competencia1.nota}/200
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia1.comentario}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Competência 2: Compreensão da proposta</h4>
                    <span className={`font-bold ${getCompetenceGradeColor(result.competencia2.nota)}`}>
                      {result.competencia2.nota}/200
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia2.comentario}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Competência 3: Capacidade argumentativa</h4>
                    <span className={`font-bold ${getCompetenceGradeColor(result.competencia3.nota)}`}>
                      {result.competencia3.nota}/200
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia3.comentario}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Competência 4: Mecanismos linguísticos</h4>
                    <span className={`font-bold ${getCompetenceGradeColor(result.competencia4.nota)}`}>
                      {result.competencia4.nota}/200
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia4.comentario}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Competência 5: Proposta de intervenção</h4>
                    <span className={`font-bold ${getCompetenceGradeColor(result.competencia5.nota)}`}>
                      {result.competencia5.nota}/200
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia5.comentario}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-800 mb-4">Sua Redação</h3>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
              {result.redacaoOriginal}
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <Link
              href="/redacao"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full inline-block transition duration-200"
            >
              Fazer Novo Simulado
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

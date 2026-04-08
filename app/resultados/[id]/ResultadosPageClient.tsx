"use client";

import { useState, useEffect } from "react";
import { EssayResult } from "@/types";
import Link from "next/link";
import { getBrowserClient } from "@/lib/db";
import { useAuth } from "@/lib/auth/context";

type ResultadosPageClientProps = {
  essayId: string;
};

export default function ResultadosPageClient({ essayId }: ResultadosPageClientProps) {
  const [result, setResult] = useState<EssayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const supabase = getBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch(`/api/resultados/${essayId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

    if (authLoading) {
      return;
    }

    if (!user) {
      setError("Faça login para visualizar suas correções.");
      setLoading(false);
      return;
    }

    void fetchResult();
  }, [essayId, authLoading, user]);

  const getGradeColor = (grade: number) => {
    if (grade >= 800) return { text: "text-green-600", bg: "bg-green-600" };
    if (grade >= 600) return { text: "text-blue-600", bg: "bg-blue-600" };
    if (grade >= 400) return { text: "text-yellow-600", bg: "bg-yellow-600" };
    return { text: "text-red-600", bg: "bg-red-600" };
  };

  const getCompetenceGradeColor = (grade: number) => {
    if (grade >= 160) return { text: "text-green-600", bg: "bg-green-600" };
    if (grade >= 120) return { text: "text-blue-600", bg: "bg-blue-600" };
    if (grade >= 80) return { text: "text-yellow-600", bg: "bg-yellow-600" };
    return { text: "text-red-600", bg: "bg-red-600" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="loader"></div>
        <p className="mt-4 text-gray-600">Carregando sua avaliação...</p>
        <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-danger-light p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <svg className="w-12 h-12 mx-auto text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-danger mb-4">Erro</h2>
          <p className="text-gray-700 mb-6">{error || "Resultado não encontrado"}</p>
          <Link 
            href="/redacao" 
            className="btn btn-primary inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            Voltar para o Simulado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-grow">
      <div className="container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border-0 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center">
              <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resultado da sua Redação
            </h2>
            <span className="badge badge-purple">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Correção por IA
            </span>
          </div>
          
          {/* Exibir o tema usado */}
          <div className="mb-8 theme-box">
            <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              TEMA UTILIZADO:
            </h3>
            <p className="theme-text italic">
              &ldquo;{result.tema || "Os desafios da educação digital no Brasil contemporâneo"}&rdquo;
            </p>
          </div>
          
          <div className="text-center py-8 mb-8 border-b border-border-color">
            <p className="text-gray-600 dark:text-gray-300 mb-2">Sua nota final</p>
            <div className="flex items-center justify-center">
              <h3 className={`text-6xl font-bold mb-2 ${getGradeColor(result.nota).text}`}>
                {result.nota}
              </h3>
              <div className="ml-4 text-left">
                <div className="text-xs text-gray-500 mb-1">escala ENEM</div>
                <div className="w-32 h-2 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className={`h-full ${getGradeColor(result.nota).bg}`} 
                    style={{width: `${result.nota/10}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">0-1000 pontos</div>
              </div>
            </div>
          </div>
          
          <div className="mb-8 animate-fadeIn" style={{animationDelay: "0.1s"}}>
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Feedback Geral
            </h3>
            <div className="bg-primary-light p-5 rounded-lg border border-primary/20">
              <p className="leading-relaxed">{result.feedbackGeral}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8 animate-stagger">
            <div>
              <h3 className="text-xl font-bold text-success mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pontos Fortes
              </h3>
              <ul className="space-y-3">
                {result.pontoFortes.map((ponto, index) => (
                  <li key={`forte-${index}`} className="bg-success-light p-3 rounded-lg border border-success/20 flex items-start">
                    <svg className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-warning mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Pontos a Melhorar
              </h3>
              <ul className="space-y-3">
                {result.pontosAMelhorar.map((ponto, index) => (
                  <li key={`melhorar-${index}`} className="bg-warning-light p-3 rounded-lg border border-warning/20 flex items-start">
                    <svg className="w-5 h-5 text-warning mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-8 animate-fadeIn" style={{animationDelay: "0.3s"}}>
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Análise por Competências
            </h3>
            
            <div className="space-y-6">
              {/* Competência 1 */}
              <div className="card overflow-hidden border-0">
                <div className="bg-muted-bg p-4 border-b border-border-color">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="font-semibold flex-grow">Competência 1: Domínio da norma culta</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${getCompetenceGradeColor(result.competencia1.nota).bg}`} 
                          style={{width: `${(result.competencia1.nota/200)*100}%`}}
                        ></div>
                      </div>
                      <span className={`font-bold ${getCompetenceGradeColor(result.competencia1.nota).text}`}>
                        {result.competencia1.nota}/200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia1.comentario}</p>
                </div>
              </div>
              
              {/* Competência 2 */}
              <div className="card overflow-hidden border-0">
                <div className="bg-muted-bg p-4 border-b border-border-color">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="font-semibold flex-grow">Competência 2: Compreensão da proposta</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${getCompetenceGradeColor(result.competencia2.nota).bg}`} 
                          style={{width: `${(result.competencia2.nota/200)*100}%`}}
                        ></div>
                      </div>
                      <span className={`font-bold ${getCompetenceGradeColor(result.competencia2.nota).text}`}>
                        {result.competencia2.nota}/200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia2.comentario}</p>
                </div>
              </div>
              
              {/* Competência 3 */}
              <div className="card overflow-hidden border-0">
                <div className="bg-muted-bg p-4 border-b border-border-color">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="font-semibold flex-grow">Competência 3: Capacidade argumentativa</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${getCompetenceGradeColor(result.competencia3.nota).bg}`} 
                          style={{width: `${(result.competencia3.nota/200)*100}%`}}
                        ></div>
                      </div>
                      <span className={`font-bold ${getCompetenceGradeColor(result.competencia3.nota).text}`}>
                        {result.competencia3.nota}/200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia3.comentario}</p>
                </div>
              </div>
              
              {/* Competência 4 */}
              <div className="card overflow-hidden border-0">
                <div className="bg-muted-bg p-4 border-b border-border-color">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="font-semibold flex-grow">Competência 4: Mecanismos linguísticos</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${getCompetenceGradeColor(result.competencia4.nota).bg}`} 
                          style={{width: `${(result.competencia4.nota/200)*100}%`}}
                        ></div>
                      </div>
                      <span className={`font-bold ${getCompetenceGradeColor(result.competencia4.nota).text}`}>
                        {result.competencia4.nota}/200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia4.comentario}</p>
                </div>
              </div>
              
              {/* Competência 5 */}
              <div className="card overflow-hidden border-0">
                <div className="bg-muted-bg p-4 border-b border-border-color">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="font-semibold flex-grow">Competência 5: Proposta de intervenção</h4>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${getCompetenceGradeColor(result.competencia5.nota).bg}`} 
                          style={{width: `${(result.competencia5.nota/200)*100}%`}}
                        ></div>
                      </div>
                      <span className={`font-bold ${getCompetenceGradeColor(result.competencia5.nota).text}`}>
                        {result.competencia5.nota}/200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p>{result.competencia5.comentario}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8 animate-fadeIn" style={{animationDelay: "0.4s"}}>
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Sua Redação
            </h3>
            <div className="bg-muted-bg p-5 rounded-lg border-0 whitespace-pre-line">
              <div className="italic text-sm mb-2 text-gray-500">Texto original enviado:</div>
              {result.redacaoOriginal}
            </div>
          </div>
          
          <div className="flex justify-center mt-10">
            <Link
              href="/redacao"
              className="theme-btn btn"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Fazer Novo Simulado
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

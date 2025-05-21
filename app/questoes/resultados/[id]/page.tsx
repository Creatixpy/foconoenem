"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizResult } from "@/types";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Link from "next/link";

export default function ResultadosQuestoesPage() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resultado-questoes/${id}`);
        
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

  // Agrupar questões por disciplina
  const questionsBySubject = result?.questoes.reduce<{[key: string]: typeof result.questoes}>((acc, question) => {
    if (!acc[question.disciplina]) {
      acc[question.disciplina] = [];
    }
    acc[question.disciplina].push(question);
    return acc;
  }, {}) || {};

  const getGradeColor = (grade: number) => {
    if (grade >= 800) return "text-green-600";
    if (grade >= 600) return "text-blue-600";
    if (grade >= 400) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="loader"></div>
        <p className="mt-4 text-gray-600">Carregando seu resultado...</p>
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
            href="/questoes" 
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color animate-fadeIn">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center">
              <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resultado do Simulado
            </h2>
          </div>
          
          <div className="text-center py-8 mb-8 border-b border-border-color">
            <p className="text-gray-600 dark:text-gray-300 mb-2">Sua pontuação final</p>
            <div className="flex items-center justify-center">
              <h3 className={`text-6xl font-bold mb-2 ${getGradeColor(result.pontuacao)}`}>
                {result.pontuacao}
              </h3>
              <div className="ml-4 text-left">
                <div className="text-xs text-gray-500 mb-1">escala ENEM</div>
                <div className="w-32 h-2 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className={`h-full ${getGradeColor(result.pontuacao).replace('text-', 'bg-')}`} 
                    style={{width: `${result.pontuacao/10}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">0-1000 pontos</div>
              </div>
            </div>
            <p className="mt-4 text-lg">
              Você acertou <span className="font-bold">{result.acertos}</span> de <span className="font-bold">{result.questoes.length}</span> questões
            </p>
          </div>

          {/* Exibir questões agrupadas por disciplina */}
          {Object.entries(questionsBySubject).map(([disciplina, questoesDaDisciplina]) => (
            <div key={disciplina} className="mb-10 animate-fadeIn" style={{animationDelay: "0.2s"}}>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-primary">{disciplina}</span>
              </h3>
              <div className="space-y-8">
                {questoesDaDisciplina.map((question, index) => {
                  const userAnswer = result.respostas[question.id];
                  const isCorrect = userAnswer === question.respostaCorreta;
                  
                  return (
                    <div key={question.id} className="card p-5 border border-border-color">
                      <div className="mb-4">
                        <div className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Questão {result.questoes.findIndex(q => q.id === question.id) + 1}</span>
                          {isCorrect ? (
                            <span className="bg-success-light text-success px-3 py-1 rounded-full text-xs font-medium flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Acertou
                            </span>
                          ) : (
                            <span className="bg-danger-light text-danger px-3 py-1 rounded-full text-xs font-medium flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Errou
                            </span>
                          )}
                        </div>
                        <p className="text-lg">{question.enunciado}</p>
                      </div>
                      
                      <div className="space-y-2">
                        {(["a", "b", "c", "d"] as const).map((option) => {
                          let bgColor = "";
                          if (option === question.respostaCorreta) {
                            bgColor = "bg-success-light border-success";
                          } else if (option === userAnswer && option !== question.respostaCorreta) {
                            bgColor = "bg-danger-light border-danger";
                          }
                          
                          return (
                            <div 
                              key={option} 
                              className={`flex items-start p-3 rounded-lg border ${bgColor}`}
                            >
                              <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                {option === question.respostaCorreta ? (
                                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : option === userAnswer ? (
                                  <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ) : (
                                  <span className="w-4 h-4 block border border-gray-300 rounded-full"></span>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold">{option.toUpperCase()}) </span>
                                <span>{question.alternativas[option]}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {question.explicacao && (
                        <div className="mt-4 p-3 bg-muted-bg rounded-lg">
                          <p className="text-sm font-medium mb-1">Explicação:</p>
                          <p className="text-sm">{question.explicacao}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mt-10">
            <Link
              href="/questoes"
              className="theme-btn btn"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Fazer Novo Simulado
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizResult } from "@/types";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function ResultadoQuestoes() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Função para carregar os resultados
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        
        // Verificar primeiramente se temos os resultados no localStorage
        const cachedResult = localStorage.getItem(`quiz_result_${id}`);
        
        if (cachedResult) {
          setResult(JSON.parse(cachedResult));
          setLoading(false);
          return;
        }
        
        // Se não há cache, precisamos redirecionar para a página de questões
        // pois não temos API para buscar resultados antigos
        setError("Resultado não encontrado ou expirado");
        
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

  // Função para determinar a cor baseada na pontuação
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-danger";
  };

  // Função para determinar a cor de fundo baseada na pontuação
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success-light";
    if (score >= 60) return "bg-primary-light";
    if (score >= 40) return "bg-warning-light";
    return "bg-danger-light";
  };

  // Função para determinar a mensagem baseada na pontuação
  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excelente!';
    if (score >= 70) return 'Muito bom!';
    if (score >= 50) return 'Bom';
    if (score >= 30) return 'Regular';
    return 'Precisa melhorar';
  };

  const subjectNames = {
    matematica: "Matemática",
    portugues: "Português",
    quimica: "Química",
    fisica: "Física",
    geografia: "Geografia"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="loader mx-auto"></div>
            <p className="mt-4 text-xl">Carregando resultados...</p>
            <p className="text-sm mt-2 text-gray-500">
              Aguarde enquanto processamos seus resultados
            </p>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 mx-auto text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-danger mb-4">Erro</h2>
            <p className="mb-6">{error || "Resultado não encontrado"}</p>
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
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Resultado do Simulado
          </h2>
          
          <div className="text-center mb-8 bg-card-bg p-6 rounded-lg shadow-md border border-border-color">
            <h3 className="text-2xl font-bold mb-2">Seu desempenho</h3>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-6">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-36 h-36 rounded-full flex items-center justify-center border-8 border-muted-bg overflow-hidden">
                    <div 
                      className={`absolute bottom-0 left-0 right-0 ${getScoreBgColor(result.score)}`} 
                      style={{height: `${result.score}%`, transition: 'height 1s ease-out'}}
                    ></div>
                    <div className="relative z-10">
                      <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                      <div className="text-xs mt-1 opacity-80">acertos</div>
                    </div>
                  </div>
                </div>
                
                <div className={`text-sm font-medium ${getScoreColor(result.score)} bg-muted-bg py-1 px-3 rounded-full inline-block`}>
                  {getScoreMessage(result.score)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6 text-center">
                <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color relative overflow-hidden">
                  <div className="absolute inset-0 bg-success-light opacity-20" style={{width: `${(result.correctAnswers/result.totalQuestions)*100}%`}}></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-success">{result.correctAnswers}</div>
                    <div className="text-sm">Acertos</div>
                  </div>
                </div>
                
                <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color relative overflow-hidden">
                  <div className="absolute inset-0 bg-danger-light opacity-20" style={{width: `${(result.wrongAnswers/result.totalQuestions)*100}%`}}></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-danger">{result.wrongAnswers}</div>
                    <div className="text-sm">Erros</div>
                  </div>
                </div>
                
                <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color col-span-2">
                  <div className="text-3xl font-bold">{result.totalQuestions}</div>
                  <div className="text-sm">Total de questões</div>
                  
                  <div className="mt-3 w-full h-2 bg-muted-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success" 
                      style={{width: `${(result.correctAnswers/result.totalQuestions)*100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="inline-flex items-center bg-muted-bg py-2 px-4 rounded-lg text-sm">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Você respondeu {result.answeredQuestions.filter(q => q.userAnswer !== -1).length} 
                  de {result.totalQuestions} questões
                </span>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-4 flex items-center text-primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Revisão das Questões
          </h3>
          
          <div className="space-y-6 mb-8">
            {result.answeredQuestions.map((item, index) => (
              <div key={index} className="card overflow-hidden border border-border-color animate-fadeIn" style={{animationDelay: `${index * 0.05}s`}}>
                <div className={`p-4 ${item.isCorrect ? 'bg-success-light' : 'bg-danger-light'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-card-bg mr-2 text-sm">
                        {index + 1}
                      </span>
                      {subjectNames[item.question.subject]}
                    </h4>
                    <span className={`badge ${item.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'} flex items-center`}>
                      {item.isCorrect ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Acertou
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Errou
                        </>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="mb-4">{item.question.question}</p>
                  
                  <div className="space-y-2 mb-4">
                    {item.question.options.map((option, optionIndex) => (
                      <div 
                        key={optionIndex}
                        className={`p-3 rounded-lg border transition-colors ${
                          optionIndex === item.question.correctAnswer
                            ? 'bg-success-light border-success/30 shadow-md'
                            : optionIndex === item.userAnswer && !item.isCorrect
                            ? 'bg-danger-light border-danger/30 shadow-md'
                            : optionIndex === item.userAnswer
                            ? 'bg-primary-light border-primary/30'
                            : 'bg-card-bg border-border-color'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs font-bold ${
                            optionIndex === item.question.correctAnswer
                              ? 'bg-success text-white'
                              : optionIndex === item.userAnswer && !item.isCorrect
                              ? 'bg-danger text-white'
                              : optionIndex === item.userAnswer
                              ? 'bg-primary text-white'
                              : 'bg-muted-bg text-foreground'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <div className="flex-grow">
                            {option}
                            {optionIndex === item.question.correctAnswer && (
                              <span className="ml-2 text-success text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                </svg>
                                Resposta correta
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-primary-light p-4 rounded-lg mt-4 border border-primary/20">
                    <h5 className="font-semibold mb-2 flex items-center text-primary-dark">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Explicação:
                    </h5>
                    <p>{item.question.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/questoes" 
              className="btn btn-primary flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

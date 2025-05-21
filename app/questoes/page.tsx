"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import { MultipleChoiceQuestion } from "@/types";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";

export default function QuestoesPage() {
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: "a" | "b" | "c" | "d"}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSystemAvailable, setIsSystemAvailable] = useState(isWithinOperatingHours());
  const [operatingInfo, setOperatingInfo] = useState(getOperatingHoursInfo());
  
  const router = useRouter();

  // Verificar o horário de funcionamento a cada minuto
  useEffect(() => {
    const checkAvailability = () => {
      setIsSystemAvailable(isWithinOperatingHours());
      setOperatingInfo(getOperatingHoursInfo());
    };
    
    const timer = setInterval(checkAvailability, 60000); // 60 segundos
    
    return () => clearInterval(timer);
  }, []);

  // Carregar questões quando a página for carregada
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!isSystemAvailable) {
        setError(`Sistema fora do horário de funcionamento. Disponível das ${operatingInfo.opensAt} às ${operatingInfo.closesAt}.`);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/gerar-questoes");
        
        if (!response.ok) {
          throw new Error("Não foi possível carregar as questões");
        }
        
        const data = await response.json();
        setQuestions(data.questoes);
      } catch (error) {
        console.error("Erro ao carregar questões:", error);
        setError(error instanceof Error ? error.message : "Ocorreu um erro ao carregar as questões");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [isSystemAvailable, operatingInfo.closesAt, operatingInfo.opensAt]);

  // Agrupar questões por disciplina
  const questionsBySubject = questions.reduce<{[key: string]: MultipleChoiceQuestion[]}>((acc, question) => {
    if (!acc[question.disciplina]) {
      acc[question.disciplina] = [];
    }
    acc[question.disciplina].push(question);
    return acc;
  }, {});

  // Manipular seleção de respostas
  const handleAnswerSelect = (questionId: string, answer: "a" | "b" | "c" | "d") => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Enviar respostas para correção
  const handleSubmit = async () => {
    if (!isSystemAvailable) {
      setError(`Sistema fora do horário de funcionamento. Disponível das ${operatingInfo.opensAt} às ${operatingInfo.closesAt}.`);
      return;
    }

    // Verificar se todas as questões foram respondidas
    const answeredQuestions = Object.keys(selectedAnswers).length;
    if (answeredQuestions < questions.length) {
      alert(`Você respondeu apenas ${answeredQuestions} de ${questions.length} questões. Por favor, responda todas as questões antes de enviar.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch("/api/corrigir-questoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          respostas: selectedAnswers,
          questoes: questions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Erro ao enviar respostas");
      }
      
      const data = await response.json();
      
      // Redirecionar para a página de resultados
      router.push(`/questoes/resultados/${data.id}`);
      
    } catch (error) {
      console.error("Erro:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar suas respostas");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="loader mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Gerando questões...</p>
            <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        <div className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="card p-6 max-w-md w-full border border-danger/30 bg-danger-light/30">
            <div className="text-center mb-4">
              <svg className="w-12 h-12 text-danger mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-danger mt-2">Erro</h3>
            </div>
            <p className="text-center mb-6">{error}</p>
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Simulado de Questões Objetivas
          </h2>
          
          {error && (
            <div className="bg-danger-light text-danger p-4 rounded-lg mb-8 animate-fadeIn flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Erro:</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div className="mb-8 p-4 bg-primary-light rounded-lg border border-border-color">
            <h3 className="font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              INSTRUÇÕES:
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Este simulado contém 10 questões de múltipla escolha, sendo 2 de cada disciplina: Matemática, Português, Química, Física e Geografia.</li>
              <li>Cada questão possui 4 alternativas (A, B, C, D), das quais apenas uma é correta.</li>
              <li>Todas as questões possuem o mesmo valor. Ao final, sua pontuação será calculada de 0 a 1000.</li>
              <li>Responda todas as questões antes de enviar para correção.</li>
            </ul>
          </div>

          {/* Exibir questões agrupadas por disciplina */}
          {Object.entries(questionsBySubject).map(([disciplina, questoesDaDisciplina]) => (
            <div key={disciplina} className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-primary">{disciplina}</span>
              </h3>
              <div className="space-y-8">
                {questoesDaDisciplina.map((question, index) => (
                  <div key={question.id} className="card p-5 border border-border-color">
                    <div className="mb-4">
                      <div className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Questão {questions.findIndex(q => q.id === question.id) + 1}
                      </div>
                      <p className="text-lg">{question.enunciado}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {(["a", "b", "c", "d"] as const).map((option) => (
                        <label 
                          key={option} 
                          className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAnswers[question.id] === option 
                              ? 'bg-primary-light border-primary' 
                              : 'hover:bg-muted-bg border-border-color'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={selectedAnswers[question.id] === option}
                            onChange={() => handleAnswerSelect(question.id, option)}
                            className="form-radio mt-1 mr-3"
                          />
                          <div>
                            <span className="font-semibold">{option.toUpperCase()}) </span>
                            <span>{question.alternativas[option]}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center mt-10">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {Object.keys(selectedAnswers).length} de {questions.length} questões respondidas
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isSystemAvailable}
              className={`${isSubmitting || !isSystemAvailable ? "bg-gray-400" : ""} theme-btn btn`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Enviando...
                </>
              ) : !isSystemAvailable ? (
                <>
                  Sistema Indisponível
                </>
              ) : (
                <>
                  Finalizar e ver resultado
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

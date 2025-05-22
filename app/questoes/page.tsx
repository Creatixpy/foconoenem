"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import QuestionCard from "../components/QuestionCard";
import QuizResults from "../components/QuizResults";
import { Question, QuizResult } from "@/types";
import { isWithinOperatingHours } from "@/lib/schedule";

export default function QuestoesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSystemAvailable, setIsSystemAvailable] = useState(isWithinOperatingHours());
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  // Novo estado para controlar se o usuário iniciou o simulado
  const [hasStarted, setHasStarted] = useState(false);
  
  // Verificar horário de funcionamento a cada minuto
  useEffect(() => {
    const checkAvailability = () => {
      setIsSystemAvailable(isWithinOperatingHours());
    };
    
    const timer = setInterval(checkAvailability, 60000); // 60 segundos
    
    return () => clearInterval(timer);
  }, []);
  
  // Função para iniciar o simulado e carregar as questões
  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasStarted(true);
      
      if (!isSystemAvailable) {
        setError("O sistema está fora do horário de funcionamento (7h às 22h).");
        setLoading(false);
        return;
      }
      
      const response = await fetch("/api/questoes");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Erro ao carregar questões");
      }
      
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao carregar as questões");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnswerSelected = (questionId: string, alternativeId: string) => {
    console.log(`Resposta selecionada: Questão ${questionId}, Alternativa ${alternativeId}`);
    
    setSelectedAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: alternativeId
      };
      console.log("Estado atualizado:", updated);
      return updated;
    });
  };
  
  // Debugging: Monitorar mudanças em selectedAnswers
  useEffect(() => {
    console.log("selectedAnswers atualizado:", selectedAnswers);
  }, [selectedAnswers]);
  
  const calculateResults = () => {
    if (!questions.length) return null;
    
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredQuestions = 0;
    const questionResults = [];
    
    for (const question of questions) {
      const selectedAlternativeId = selectedAnswers[question.id];
      const correctAlternativeId = question.alternatives.find(alt => alt.isCorrect)?.id;
      
      const result = {
        questionId: question.id,
        isCorrect: false,
        selectedAlternativeId,
        correctAlternativeId: correctAlternativeId || ""
      };
      
      if (!selectedAlternativeId) {
        unansweredQuestions++;
      } else if (selectedAlternativeId === correctAlternativeId) {
        correctAnswers++;
        result.isCorrect = true;
      } else {
        wrongAnswers++;
      }
      
      questionResults.push(result);
    }
    
    return {
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      unansweredQuestions,
      score: correctAnswers,
      questionResults
    };
  };
  
  const handleSubmitQuiz = () => {
    const result = calculateResults();
    setQuizResult(result);
    setShowResults(true);
    
    // Rolar para o topo da página para mostrar o resultado
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRetakeQuiz = async () => {
    setShowResults(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setHasStarted(false); // Voltar para a tela inicial
  };
  
  const isQuestionAnswered = (questionId: string) => {
    return !!selectedAnswers[questionId];
  };
  
  const getQuestionResult = (questionId: string) => {
    if (!showResults || !quizResult) return undefined;
    
    return quizResult.questionResults.find(result => result.questionId === questionId);
  };
  
  // Componente de introdução do simulado
  const QuizIntroduction = () => (
    <div className="card p-8 border border-border-color animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Simulado de Questões Objetivas
        </h2>
        <p className="text-lg text-foreground dark:text-gray-300">
          Teste seus conhecimentos nas principais disciplinas do ENEM
        </p>
      </div>
      
      <div className="bg-primary-light p-6 rounded-lg mb-8 text-foreground">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Como funciona:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-bold mr-2 text-sm">1</span>
            <p>O simulado contém 10 questões de múltipla escolha (2 de cada disciplina: Matemática, Português, Química, Física e Geografia)</p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-bold mr-2 text-sm">2</span>
            <p>Selecione uma alternativa para cada questão (A, B, C ou D)</p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-bold mr-2 text-sm">3</span>
            <p>Após responder, clique em "Finalizar e Ver Resultados"</p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-bold mr-2 text-sm">4</span>
            <p>Você receberá sua pontuação e explicações detalhadas para cada questão</p>
          </li>
        </ul>
      </div>
      
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        {['Matemática', 'Português', 'Química', 'Física', 'Geografia'].map((discipline) => {
          let bgColor = '';
          let textColor = '';
          
          switch(discipline) {
            case 'Matemática':
              bgColor = 'bg-blue-100 dark:bg-blue-900/30';
              textColor = 'text-blue-800 dark:text-blue-300';
              break;
            case 'Português':
              bgColor = 'bg-red-100 dark:bg-red-900/30';
              textColor = 'text-red-800 dark:text-red-300';
              break;
            case 'Química':
              bgColor = 'bg-green-100 dark:bg-green-900/30';
              textColor = 'text-green-800 dark:text-green-300';
              break;
            case 'Física':
              bgColor = 'bg-purple-100 dark:bg-purple-900/30';
              textColor = 'text-purple-800 dark:text-purple-300';
              break;
            case 'Geografia':
              bgColor = 'bg-amber-100 dark:bg-amber-900/30';
              textColor = 'text-amber-800 dark:text-amber-300';
              break;
          }
          
          return (
            <div 
              key={discipline} 
              className={`p-3 rounded-lg text-center ${bgColor}`}
            >
              <span className={`text-sm font-medium ${textColor}`}>
                {discipline}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-col items-center mt-10">
        <p className="text-sm text-gray-500 mb-4">
          Ao clicar em "Iniciar Simulado", nossas questões serão geradas pela IA com base nas disciplinas do ENEM
        </p>
        <button 
          onClick={startQuiz} 
          disabled={!isSystemAvailable}
          className="theme-btn btn flex items-center"
        >
          {!isSystemAvailable ? (
            "Sistema Indisponível"
          ) : (
            <>
              Iniciar Simulado
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {/* Se o usuário ainda não iniciou o simulado, mostrar a introdução */}
        {!hasStarted ? (
          <QuizIntroduction />
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Simulado de Questões Objetivas
              </h2>
              <p className="text-foreground dark:text-gray-300 mb-8">
                Responda as 10 questões abaixo e teste seus conhecimentos em diferentes disciplinas. 
                O simulado contém 2 questões de cada uma das seguintes matérias: Matemática, Português, Química, Física e Geografia.
              </p>
            </section>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="loader"></div>
                <p className="mt-4 text-gray-600">Carregando questões...</p>
                <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
              </div>
            ) : error ? (
              <div className="bg-danger-light text-danger p-6 rounded-lg my-8 animate-fadeIn flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-lg mb-2">Erro:</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <>
                {showResults && quizResult && (
                  <QuizResults 
                    result={quizResult} 
                    onRetakeQuiz={handleRetakeQuiz} 
                  />
                )}
                
                <div className="my-8">
                  {questions.map((question, index) => {
                    const selected = selectedAnswers[question.id];
                    console.log(`Renderizando questão ${index + 1}, ID ${question.id}, Selecionada: ${selected}`);
                    
                    return (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        questionNumber={index + 1}
                        onAnswerSelected={handleAnswerSelected}
                        selectedAlternativeId={selected}
                        showResults={showResults}
                        isCorrect={getQuestionResult(question.id)?.isCorrect}
                      />
                    );
                  })}
                </div>
                
                {!showResults && questions.length > 0 && (
                  <div className="flex justify-between items-center py-6 sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border-color mt-6 -mx-4 px-4">
                    <div className="text-sm">
                      <span className="font-medium">
                        {Object.keys(selectedAnswers).length} de {questions.length} respondidas
                      </span>
                    </div>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!isSystemAvailable}
                      className="theme-btn btn"
                    >
                      {!isSystemAvailable ? (
                        "Sistema Indisponível"
                      ) : (
                        <>
                          Finalizar e Ver Resultados
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

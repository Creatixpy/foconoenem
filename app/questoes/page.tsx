"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import QuestionCard from "../components/QuestionCard";
import QuizResults from "../components/QuizResults";
import { Question, QuizResult } from "@/types";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";
import { supabase } from "@/lib/supabase";

const QUESTIONS_PER_DISCIPLINE = 3;

export default function QuestoesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSystemAvailable, setIsSystemAvailable] = useState(isWithinOperatingHours());
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  // Novo estado para controlar se o usuário iniciou o simulado
  const [hasStarted, setHasStarted] = useState(false);
  // Estado para disciplinas selecionadas
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(
    new Set(['Matemática', 'Português', 'Química', 'Física', 'Geografia'])
  );
  
  // Verificar horário de funcionamento a cada minuto
  useEffect(() => {
    const checkAvailability = () => {
      setIsSystemAvailable(isWithinOperatingHours());
    };
    
    const timer = setInterval(checkAvailability, 60000); // 60 segundos
    
    return () => clearInterval(timer);
  }, []);
  
  // Função para alternar seleção de disciplina
  const toggleDiscipline = (discipline: string) => {
    setSelectedDisciplines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discipline)) {
        newSet.delete(discipline);
      } else {
        newSet.add(discipline);
      }
      return newSet;
    });
  };
  
  // Função para iniciar o simulado e carregar as questões
  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasStarted(true);
      setSaveStatusMessage(null);
      
      if (!isSystemAvailable) {
        const { opensAt, closesAt } = getOperatingHoursInfo();
        setError(`O sistema está fora do horário de funcionamento (${opensAt} às ${closesAt}).`);
        setLoading(false);
        return;
      }
      
      if (selectedDisciplines.size === 0) {
        setError("Selecione pelo menos uma disciplina para iniciar o simulado.");
        setLoading(false);
        setHasStarted(false);
        return;
      }
      
      // Passar disciplinas selecionadas como query parameter
      const disciplinesParam = Array.from(selectedDisciplines).join(',');
      const response = await fetch(`/api/questoes?disciplines=${encodeURIComponent(disciplinesParam)}`);
      
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
    setSelectedAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: alternativeId
      };
      return updated;
    });
  };
  
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
    setSaveStatusMessage(null);

    if (result) {
      void saveQuizResult(result);
    }
    
    // Rolar para o topo da página para mostrar o resultado
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRetakeQuiz = async () => {
    setShowResults(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setHasStarted(false); // Voltar para a tela inicial
    setQuestions([]);
    setSaveStatusMessage(null);
  };
  
  const getQuestionResult = (questionId: string) => {
    if (!showResults || !quizResult) return undefined;
    
    return quizResult.questionResults.find(result => result.questionId === questionId);
  };
  
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);
  const progressPercentage = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const nextQuestionIndex = Math.min(answeredCount + 1, questions.length);

  const saveQuizResult = async (computedResult: QuizResult) => {
    try {
      setSaveStatusMessage("Salvando resultado na sua conta...");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        setSaveStatusMessage("Faça login para salvar seus simulados no histórico da conta.");
        return;
      }

      const response = await fetch("/api/questoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          result: computedResult,
          selectedAnswers,
          questions,
          disciplines: Array.from(selectedDisciplines),
        }),
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      const parsed = (() => {
        if (responseData && typeof responseData === "object") {
          const record = responseData as Record<string, unknown>;
          return {
            saved: typeof record.saved === "boolean" ? record.saved : undefined,
            reason: typeof record.reason === "string" ? record.reason : undefined,
            error: typeof record.error === "string" ? record.error : undefined,
            message: typeof record.message === "string" ? record.message : undefined,
          };
        }
        return {} as {
          saved?: boolean;
          reason?: string;
          error?: string;
          message?: string;
        };
      })();

      if (!response.ok) {
        const message = parsed.error || parsed.message || "Falha ao salvar resultado do simulado";
        throw new Error(message);
      }

      if (parsed.saved) {
        setSaveStatusMessage("Simulado salvo na sua conta! Revise seus dados em Minha Conta.");
      } else if (parsed.reason === "invalid_token") {
        setSaveStatusMessage("Sua sessão expirou. Faça login novamente para salvar seus resultados.");
      } else if (parsed.reason === "not_authenticated" || parsed.reason === "user_not_found") {
        setSaveStatusMessage("Faça login para salvar seus simulados no histórico da conta.");
      } else {
        setSaveStatusMessage("Não foi possível confirmar o salvamento deste simulado. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("Erro ao salvar resultado do simulado:", error);
      setSaveStatusMessage("Não foi possível salvar o resultado do simulado. Tente novamente mais tarde.");
    }
  };
  
  // Componente de introdução do simulado
  const QuizIntroduction = () => {
    const disciplineOptions = [
      {
        name: "Matemática",
        description: "Cálculo, funções e estatística",
        accent: "from-blue-500/10 to-blue-700/10",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m0 4v11m0-11H4m4 0h4m4 10v4m0-4V6m0 10h4m-4 0h-4m-7 5h14" />
          </svg>
        ),
      },
      {
        name: "Português",
        description: "Interpretação de textos e gramática",
        accent: "from-rose-500/10 to-red-600/10",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5l4 4-11 11H5v-4l11-11z" />
          </svg>
        ),
      },
      {
        name: "Química",
        description: "Reações, ligações e química orgânica",
        accent: "from-emerald-500/10 to-emerald-700/10",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-4l-3 7 1 9h4l3-7-1-9zM5 4h4l3 7-1 9H7l-3-7 1-9z" />
          </svg>
        ),
      },
      {
        name: "Física",
        description: "Movimentos, energia e eletricidade",
        accent: "from-purple-500/10 to-indigo-700/10",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        name: "Geografia",
        description: "Mapas, climatologia e globalização",
        accent: "from-amber-500/10 to-orange-600/10",
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 110-8 4 4 0 010 8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12a10 10 0 0020 0 10 10 0 00-20 0zm10 10c-2.5 0-3.5-1.5-4-2" />
          </svg>
        ),
      },
    ];

    return (
      <div className="relative overflow-hidden rounded-3xl border border-border-color bg-gradient-to-br from-background via-background to-muted-bg p-6 md:p-12 animate-fadeIn">
        <div className="absolute inset-0 -z-10 opacity-30" aria-hidden>
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute -bottom-10 left-10 h-52 w-52 rounded-full bg-accent/20 blur-3xl"></div>
        </div>

        <div className="flex flex-col gap-6 md:gap-10">
          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-2xl border border-border-color bg-card-bg/70 p-6 shadow-sm backdrop-blur">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                  <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-primary">Simulado inteligente</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">Construa seu treino personalizado do ENEM</h2>
                  <p className="mt-3 text-base text-foreground/80">
                    Selecione as disciplinas que quer focar, receba 3 questões geradas por IA para cada uma e veja explicações detalhadas logo após finalizar.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[{
                  label: "Questões sob medida",
                  value: `${selectedDisciplines.size || 1} x ${QUESTIONS_PER_DISCIPLINE}`,
                  detail: "Por disciplina selecionada",
                }, {
                  label: "Tempo sugerido",
                  value: "20 min",
                  detail: "Para concluir o bloco completo",
                }, {
                  label: "Feedback imediato",
                  value: "100% IA",
                  detail: "Explicações comentadas por questão",
                }].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border-color bg-card-bg/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-foreground/70">{item.label}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{item.value}</p>
                    <p className="text-sm text-foreground/70 mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-full rounded-2xl border border-border-color bg-card-bg/80 p-6 shadow-sm backdrop-blur">
              <h3 className="text-lg font-semibold text-foreground">Como funciona</h3>
              <ol className="mt-4 space-y-4 text-sm text-foreground/80">
                {[
                  "Escolha de 1 a 5 disciplinas para praticar agora.",
                  `Geramos automaticamente ${QUESTIONS_PER_DISCIPLINE} questões inéditas para cada disciplina.`,
                  "Responda no seu ritmo e acompanhe o progresso em tempo real.",
                  "Finalize para descobrir acertos, erros, lacunas e receber explicações bem diretas.",
                ].map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 text-center">
              <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Monte seu simulado escolhendo as matérias:
              </h3>
              <p className="text-sm text-foreground/70">
                Cada disciplina adiciona automaticamente três questões. Misture áreas para um treino completo ou foque naqueles tópicos que mais precisa revisar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {disciplineOptions.map((discipline) => {
                const isSelected = selectedDisciplines.has(discipline.name);
                return (
                  <button
                    key={discipline.name}
                    onClick={() => toggleDiscipline(discipline.name)}
                    className={`group flex h-full flex-col rounded-2xl border border-border-color bg-card-bg/80 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isSelected ? "ring-2 ring-primary/70 ring-offset-2 ring-offset-background" : "opacity-75 hover:opacity-100"}`}
                  >
                    <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${discipline.accent} text-primary`}>{discipline.icon}</span>
                    <strong className="text-base text-foreground">{discipline.name}</strong>
                    <span className="mt-2 text-sm text-foreground/70">{discipline.description}</span>
                    <span className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${isSelected ? "border-primary/40 bg-primary/10 text-primary" : "border-border-color text-foreground/60"}`}>
                      {isSelected ? (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Selecionada
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Adicionar ao treino
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-foreground/80">
              <p>
                {selectedDisciplines.size === 0 ? (
                  "Selecione pelo menos uma disciplina para liberar o botão de iniciar simulado."
                ) : (
                  <>
                    <strong>{selectedDisciplines.size}</strong> {selectedDisciplines.size === 1 ? "disciplina escolhida" : "disciplinas escolhidas"} •
                    <strong> {selectedDisciplines.size * QUESTIONS_PER_DISCIPLINE}</strong> questões serão geradas nesta rodada.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-color bg-card-bg/90 p-6 text-center shadow-sm backdrop-blur">
            <p className="text-sm text-foreground/70">
              As questões são criadas na hora por IA e trazem explicações para cada alternativa após a correção.
            </p>
            <button
              onClick={startQuiz}
              disabled={!isSystemAvailable || selectedDisciplines.size === 0}
              className="theme-btn btn flex items-center"
            >
              {!isSystemAvailable ? (
                "Sistema Indisponível"
              ) : selectedDisciplines.size === 0 ? (
                "Selecione pelo menos uma disciplina"
              ) : (
                <>
                  Iniciar simulado agora
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-6xl">
        {/* Se o usuário ainda não iniciou o simulado, mostrar a introdução */}
        {!hasStarted ? (
          <QuizIntroduction />
        ) : (
          <>
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
                <section className="mb-8 space-y-6">
                  <div className="rounded-3xl border border-border-color bg-card-bg/90 p-5 shadow-sm backdrop-blur sm:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-primary">Simulado em andamento</p>
                        <h2 className="mt-1 text-2xl font-bold text-foreground">
                          {showResults ? "Confira seu desempenho" : "Responda as questões abaixo"}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm text-foreground/70">
                          Você selecionou {selectedDisciplines.size} {selectedDisciplines.size === 1 ? "disciplina" : "disciplinas"}: {Array.from(selectedDisciplines).join(', ')}.
                          {questions.length > 0 && " Complete todas para aproveitar o feedback detalhado."}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/30 sm:h-20 sm:w-20">
                          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <path
                              className="text-primary/20"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                            />
                            <path
                              className="text-primary"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${progressPercentage}, 100`}
                              fill="none"
                              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                            />
                          </svg>
                          <span className="relative text-lg font-semibold text-primary">{progressPercentage}%</span>
                        </div>
                        <div className="text-center text-sm text-foreground/70 sm:text-left">
                          <p><strong>{answeredCount}</strong> respondidas</p>
                          <p><strong>{unansweredCount}</strong> pendentes</p>
                          <p>Próxima questão: {nextQuestionIndex || 1}</p>
                        </div>
                      </div>
                    </div>
                    {questions.length > 0 && (
                      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted-bg">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all"
                          style={{ width: `${progressPercentage}%` }}
                          aria-hidden
                        ></div>
                      </div>
                    )}
                  </div>
                </section>

                {showResults && quizResult && (
                  <>
                    <QuizResults 
                      result={quizResult} 
                      onRetakeQuiz={handleRetakeQuiz} 
                    />
                    {saveStatusMessage && (
                      <div className="mt-4 rounded-xl border border-border-color bg-muted-bg/80 p-4 text-sm text-foreground/80">
                        {saveStatusMessage}
                      </div>
                    )}
                  </>
                )}
                
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
                  <aside className="order-first flex h-fit flex-col gap-4 rounded-3xl border border-border-color bg-card-bg/90 p-5 shadow-sm backdrop-blur lg:order-last lg:sticky lg:top-28">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Resumo rápido</h3>
                      <p className="text-foreground/80">
                        {answeredCount} de {questions.length} questões respondidas.
                        {unansweredCount > 0 && ` Faltam ${unansweredCount}.`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border-color bg-muted-bg/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-primary">Dica</p>
                      <p className="mt-2 text-sm text-foreground/80">
                        Use as respostas incorretas como diagnóstico: leia cada explicação com calma e anote os conceitos que precisam de revisão rápida.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground/80">Disciplinas desta rodada</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedDisciplines).map((disciplina) => (
                          <span key={disciplina} className="rounded-full border border-border-color bg-card-bg px-3 py-1 text-xs text-foreground/70">
                            {disciplina}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!showResults && questions.length > 0 && (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={!isSystemAvailable}
                        className="btn btn-primary mt-2"
                      >
                        {!isSystemAvailable ? (
                          "Sistema Indisponível"
                        ) : (
                          <>
                            Finalizar e ver resultados
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </aside>
                  <div className="order-last lg:order-first">
                    {questions.map((question, index) => {
                      const selected = selectedAnswers[question.id];
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
                </div>
                
                {!showResults && questions.length > 0 && (
                  <div className="sticky bottom-0 mt-6 -mx-4 flex flex-col gap-3 border-t border-border-color bg-background/90 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    <div className="text-sm text-foreground/70 sm:text-left">
                      <span className="font-semibold text-foreground">
                        {answeredCount} / {questions.length}
                      </span>
                      {unansweredCount > 0 && (
                        <span className="ml-0 block sm:ml-2 sm:inline">Restam {unansweredCount} {unansweredCount === 1 ? "questão" : "questões"}</span>
                      )}
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

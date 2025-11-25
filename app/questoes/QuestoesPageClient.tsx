"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import QuestionCard from "../components/QuestionCard";
import { Question, QuizResult } from "@/types";
import { getOperatingHoursInfo } from "@/lib/schedule";
import { getBrowserClient } from "@/lib/db";

const OperatingHoursIndicator = dynamic(() => import("../components/OperatingHoursIndicator"), {
  ssr: false,
  loading: () => null,
});

const LazyQuizResults = dynamic(() => import("../components/QuizResults"), {
  ssr: false,
  loading: () => (
    <div className="card border-0 shadow-sm p-6 text-center">
      <p className="text-sm font-semibold text-foreground/80">Calculando seu desempenho...</p>
    </div>
  ),
});

const QUESTIONS_PER_DISCIPLINE = 3;

const disciplineOptions = [
  {
    name: "Matemática",
    description: "Cálculo, funções e estatística",
    accent: "from-blue-500/10 to-blue-700/10",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m0 4v11m0-11H4m4 0h4m4 10v4m0-4V6m0 10h4m-4 0h-4m-7 5h14" />
      </svg>
    ),
  },
  {
    name: "Português",
    description: "Texto e gramática em 3 questões",
    accent: "from-rose-500/10 to-red-600/10",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5l4 4-11 11H5v-4l11-11z" />
      </svg>
    ),
  },
  {
    name: "Química",
    description: "Reações e orgânica essenciais",
    accent: "from-emerald-500/10 to-emerald-700/10",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-4l-3 7 1 9h4l3-7-1-9zM5 4h4l3 7-1 9H7l-3-7 1-9z" />
      </svg>
    ),
  },
  {
    name: "Física",
    description: "Movimento, energia e eletricidade",
    accent: "from-purple-500/10 to-indigo-700/10",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    name: "Geografia",
    description: "Mapas, clima e globalização",
    accent: "from-amber-500/10 to-orange-600/10",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 110-8 4 4 0 010 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12a10 10 0 0020 0 10 10 0 00-20 0zm10 10c-2.5 0-3.5-1.5-4-2" />
      </svg>
    ),
  },
];

const heroHighlights = [
  {
    label: "Questões personalizadas",
    value: `${QUESTIONS_PER_DISCIPLINE} por disciplina`,
    detail: "IA gera na hora",
  },
  {
    label: "Tempo sugerido",
    value: "20 min",
    detail: "Bloco completo",
  },
  {
    label: "Feedback imediato",
    value: "Explicações comentadas",
    detail: "Acertos e lacunas",
  },
];

export default function QuestoesPageClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSystemAvailable, setIsSystemAvailable] = useState<boolean | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(
    new Set(["Matemática", "Português", "Química", "Física", "Geografia"])
  );

  useEffect(() => {
    let cancelled = false;

    const refreshAvailability = async () => {
      try {
        const info = await getOperatingHoursInfo();
        if (!cancelled) {
          setIsSystemAvailable(info.isOpen);
        }
      } catch (error) {
        console.error("Erro ao atualizar o horário de funcionamento:", error);
      }
    };

    void refreshAvailability();

    const timer = setInterval(() => {
      void refreshAvailability();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const toggleDiscipline = (discipline: string) => {
    setSelectedDisciplines((previous) => {
      const next = new Set(previous);
      if (next.has(discipline)) {
        next.delete(discipline);
      } else {
        next.add(discipline);
      }
      return next;
    });
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasStarted(true);
      setSaveStatusMessage(null);
      setInfoMessage(null);

      const info = await getOperatingHoursInfo();
      setIsSystemAvailable(info.isOpen);

      if (!info.isOpen) {
        setError(`O sistema está fora do horário de funcionamento (${info.opensAt} às ${info.closesAt}).`);
        setLoading(false);
        setHasStarted(false);
        return;
      }

      if (selectedDisciplines.size === 0) {
        setError("Selecione pelo menos uma disciplina para iniciar o simulado.");
        setLoading(false);
        setHasStarted(false);
        return;
      }

      const disciplinesParam = Array.from(selectedDisciplines).join(",");
      const response = await fetch(`/api/questoes?disciplines=${encodeURIComponent(disciplinesParam)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setHasStarted(false);
        const diagnostics = errorData?.diagnostics as Record<string, string> | undefined;
        const diagMessage = diagnostics
          ? Object.entries(diagnostics)
              .map(([disc, msg]) => `${disc}: ${msg}`)
              .join(" | ")
          : null;
        throw new Error(
          (errorData?.message || errorData?.error || "Erro ao carregar questões") +
            (diagMessage ? ` (${diagMessage})` : "")
        );
      }

      const data = await response.json();
      setQuestions(data.questions);

      if (data.diagnostics && Object.keys(data.diagnostics).length > 0) {
        const diagSummary = Object.entries(data.diagnostics as Record<string, string>)
          .map(([disc, msg]) => `${disc}: ${msg}`)
          .join(" | ");
        setInfoMessage(
          `Algumas disciplinas não responderam a tempo. Geramos questões apenas das disponíveis. Detalhes: ${diagSummary}`
        );
      } else {
        setInfoMessage(null);
      }
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao carregar as questões");
      setInfoMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelected = (questionId: string, alternativeId: string) => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: alternativeId,
    }));
  };

  const calculateResults = () => {
    if (!questions.length) return null;

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredQuestions = 0;
    const questionResults: QuizResult["questionResults"] = [];

    for (const question of questions) {
      const selectedAlternativeId = selectedAnswers[question.id];
      const correctAlternativeId = question.alternatives.find((alt) => alt.isCorrect)?.id;

      const result = {
        questionId: question.id,
        isCorrect: false,
        selectedAlternativeId,
        correctAlternativeId: correctAlternativeId || "",
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
      questionResults,
    };
  };

  const handleSubmitQuiz = () => {
    const result = calculateResults();
    if (!result) return;

    setQuizResult(result);
    setShowResults(true);
    setSaveStatusMessage(null);
    void saveQuizResult(result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetakeQuiz = async () => {
    setShowResults(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setHasStarted(false);
    setQuestions([]);
    setSaveStatusMessage(null);
    setInfoMessage(null);
  };

  const getQuestionResult = (questionId: string) => {
    if (!showResults || !quizResult) return undefined;
    return quizResult.questionResults.find((result) => result.questionId === questionId);
  };

  const saveQuizResult = async (computedResult: QuizResult) => {
    try {
      setSaveStatusMessage("Salvando resultado na sua conta...");

      const supabase = getBrowserClient();
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

      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = await response.json();
      } catch {
        parsed = null;
      }

      const saved = parsed && typeof parsed === "object" ? (parsed.saved as boolean | undefined) : undefined;
      const reason = parsed && typeof parsed === "object" ? (parsed.reason as string | undefined) : undefined;
      const message = parsed && typeof parsed === "object" ? (parsed.message as string | undefined) : undefined;
      const errorMessage = parsed && typeof parsed === "object" ? (parsed.error as string | undefined) : undefined;

      if (!response.ok) {
        throw new Error(errorMessage || message || "Falha ao salvar resultado do simulado");
      }

      if (saved) {
        setSaveStatusMessage("Simulado salvo com sucesso! Revise seus dados em Minha Conta.");
      } else if (reason === "invalid_token") {
        setSaveStatusMessage("Sua sessão expirou. Faça login novamente para salvar seus resultados.");
      } else if (reason === "not_authenticated" || reason === "user_not_found") {
        setSaveStatusMessage("Faça login para salvar seus simulados no histórico da conta.");
      } else {
        setSaveStatusMessage("Não foi possível confirmar o salvamento deste simulado. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("Erro ao salvar resultado do simulado:", error);
      setSaveStatusMessage("Não foi possível salvar o resultado do simulado. Tente novamente mais tarde.");
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);

  return (
    <>
      <OperatingHoursIndicator />

      <main className="flex-grow">
        <section
          id="questoes-hero"
          className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8"
          aria-labelledby="questoes-hero-heading questoes-hero-description"
        >
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Simulado inteligente de questões
                </div>
                <div className="space-y-5">
                  <h1 id="questoes-hero-heading" className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground">
                    Pratique questões inéditas e receba explicações na hora.
                  </h1>
                  <p id="questoes-hero-description" className="max-w-xl text-lg text-foreground/60">
                    Monte o seu treino com disciplinas específicas, responda no seu ritmo e descubra imediatamente quais
                    conteúdos precisam de reforço.
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-3">
                  {heroHighlights.map((highlight) => (
                    <div key={highlight.label} className="card border-0 shadow-sm p-5">
                      <dt className="text-xs uppercase tracking-wide text-foreground/60">{highlight.label}</dt>
                      <dd className="mt-2 text-xl font-semibold text-primary">{highlight.value}</dd>
                      <p className="mt-1 text-xs text-foreground/60">{highlight.detail}</p>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex h-full flex-col gap-6 card border-0 shadow-sm p-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Como funciona o treino personalizado</h2>
                  <ol className="mt-4 space-y-4 text-sm text-foreground/60">
                    <li className="flex gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        01
                      </span>
                      <span>Escolha de uma a cinco disciplinas para praticar agora.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        02
                      </span>
                      <span>
                        Geramos automaticamente {QUESTIONS_PER_DISCIPLINE} questões inéditas para cada disciplina selecionada.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        03
                      </span>
                      <span>Responda no seu ritmo e acompanhe o progresso em tempo real.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        04
                      </span>
                      <span>Finalize para ver acertos, erros, lacunas e explicações comentadas questão a questão.</span>
                    </li>
                  </ol>
                </div>
                <div className="rounded-xl border-0 bg-muted-bg/50 p-4 text-sm text-foreground/60">
                  {isSystemAvailable === false ? (
                    <p>
                      O simulador está indisponível no momento. Verifique os horários de funcionamento indicados acima para
                      retomar seu treino.
                    </p>
                  ) : (
                    <p>
                      As questões são geradas e analisadas por IA. Utilize as explicações para registrar os tópicos que precisam
                      de revisão rápida.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl space-y-10">
            {error && (
              <div className="rounded-2xl border border-danger/20 bg-danger-light/30 p-4 text-sm text-danger">
                <p className="font-semibold">Algo deu errado</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
            {!error && infoMessage && (
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                <p className="font-semibold">Atenção</p>
                <p className="mt-1">{infoMessage}</p>
              </div>
            )}

            {showResults && quizResult ? (
              <div className="space-y-8">
                <div className="card border-0 shadow-sm p-6 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-primary">Resultado do simulador</p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">Confira os seus números e próximos passos</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleRetakeQuiz} className="btn btn-outline px-4 py-2 text-sm">
                        Montar novo simulado
                      </button>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn btn-primary px-4 py-2 text-sm">
                        Revisar desempenho
                      </button>
                    </div>
                  </div>
                  {saveStatusMessage && <p className="text-sm text-foreground/60">{saveStatusMessage}</p>}
                </div>
                <LazyQuizResults result={quizResult} onRetakeQuiz={handleRetakeQuiz} />
              </div>
            ) : !hasStarted ? (
              <div className="card border-0 shadow-sm p-6 md:p-8 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">Monte o treino ideal para agora</h2>
                  <p className="text-sm text-foreground/60">
                    Cada disciplina adiciona automaticamente três questões. Misture áreas para um treino completo ou foque nos
                    temas que precisam de reforço imediato.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {disciplineOptions.map((discipline) => {
                    const isSelected = selectedDisciplines.has(discipline.name);
                    return (
                      <button
                        key={discipline.name}
                        onClick={() => toggleDiscipline(discipline.name)}
                        className={`group flex h-full flex-col rounded-2xl border-0 p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          isSelected 
                            ? "bg-primary/5 shadow-sm" 
                            : "bg-muted-bg/30 shadow-sm hover:bg-muted-bg/50"
                        }`}
                      >
                        <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${discipline.accent} text-primary`}>
                          {discipline.icon}
                        </span>
                        <strong className="text-base text-foreground">{discipline.name}</strong>
                        <span className="mt-2 text-sm text-foreground/60">{discipline.description}</span>
                        <span
                          className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full border-0 px-3 py-1 text-xs font-medium transition-colors ${
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted-bg/50 text-foreground/60"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Selecionada
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {selectedDisciplines.size === 0 ? (
                    "Selecione pelo menos uma disciplina para liberar o botão de iniciar simulado."
                  ) : (
                    <>
                      <strong>{selectedDisciplines.size}</strong>{" "}
                      {selectedDisciplines.size === 1 ? "disciplina escolhida" : "disciplinas escolhidas"} •
                      <strong> {selectedDisciplines.size * QUESTIONS_PER_DISCIPLINE}</strong> questões serão geradas nesta rodada.
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3 rounded-2xl border-0 bg-muted-bg/30 p-6 text-center shadow-sm">
                  <p className="text-sm text-foreground/60">
                    As questões são produzidas na hora por IA e trazem explicações detalhadas ao finalizar.
                  </p>
                  <button
                    onClick={startQuiz}
                    disabled={!isSystemAvailable || selectedDisciplines.size === 0 || loading}
                    className="btn btn-primary px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {!isSystemAvailable ? (
                      "Sistema indisponível"
                    ) : selectedDisciplines.size === 0 ? (
                      "Selecione pelo menos uma disciplina"
                    ) : loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Preparando questões...
                      </span>
                    ) : (
                      <>
                        Iniciar simulado agora
                        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="card border-0 shadow-sm p-8 md:p-12 space-y-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Gerando suas questões...</h2>
                  <p className="mt-2 max-w-md text-sm text-foreground/60">
                    Nossa IA está criando {selectedDisciplines.size * QUESTIONS_PER_DISCIPLINE} questões personalizadas 
                    para {selectedDisciplines.size === 1 ? "a disciplina selecionada" : `as ${selectedDisciplines.size} disciplinas selecionadas`}. 
                    Isso pode levar alguns segundos.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {Array.from(selectedDisciplines).map((discipline) => (
                      <span 
                        key={discipline} 
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {discipline}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {saveStatusMessage && (
                  <div className="card border-0 shadow-sm p-4 text-sm text-foreground/60">
                    <strong>Status:</strong> {saveStatusMessage}
                  </div>
                )}
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.5fr]">
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        questionNumber={index + 1}
                        onAnswerSelected={handleAnswerSelected}
                        selectedAlternativeId={selectedAnswers[question.id]}
                        showResults={showResults}
                        isCorrect={getQuestionResult(question.id)?.isCorrect}
                      />
                    ))}
                  </div>
                  <aside className="flex flex-col gap-4 card border-0 shadow-sm p-6 lg:sticky lg:top-28">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Resumo rápido</h3>
                      <p className="mt-2 text-sm text-foreground/60">
                        {answeredCount} de {questions.length} questões respondidas.
                        {unansweredCount > 0 && ` Restam ${unansweredCount}.`}
                      </p>
                    </div>
                    <div className="rounded-xl border-0 bg-muted-bg/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-primary">Dica</p>
                      <p className="mt-2 text-sm text-foreground/60">
                        Marque as alternativas com confiança. As explicações ao final destacam por que cada resposta correta faz
                        sentido — use-as como guia de revisão.
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-foreground/80">Disciplinas desta rodada</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedDisciplines).map((discipline) => (
                          <span key={discipline} className="rounded-full border-0 bg-muted-bg/50 px-3 py-1 text-xs text-foreground/60">
                            {discipline}
                          </span>
                        ))}
                      </div>
                    </div>
                    {questions.length > 0 && (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={!isSystemAvailable}
                        className="btn btn-primary mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {!isSystemAvailable ? (
                          "Sistema indisponível"
                        ) : (
                          <>
                            Finalizar e ver resultados
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </aside>
                </div>

                {questions.length > 0 && (
                  <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    <div className="text-sm text-foreground/60">
                      <span className="font-semibold text-foreground">
                        {answeredCount} / {questions.length}
                      </span>
                      {unansweredCount > 0 && (
                        <span className="ml-0 block sm:ml-2 sm:inline">
                          Restam {unansweredCount} {unansweredCount === 1 ? "questão" : "questões"}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!isSystemAvailable}
                      className="btn btn-primary px-5 py-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {!isSystemAvailable ? "Sistema indisponível" : "Finalizar e ver resultados"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

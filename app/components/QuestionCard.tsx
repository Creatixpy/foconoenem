"use client";

import { useState, useEffect } from "react";
import { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  onAnswerSelected: (questionId: string, alternativeId: string) => void;
  selectedAlternativeId?: string;
  showResults?: boolean;
  isCorrect?: boolean;
}

export default function QuestionCard({
  question,
  questionNumber,
  onAnswerSelected,
  selectedAlternativeId,
  showResults = false,
  isCorrect
}: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedAlternativeId);
  // Atualizar o estado local quando as props mudam
  useEffect(() => {
    setSelectedId(selectedAlternativeId);
  }, [selectedAlternativeId]);
  const handleSelectAlternative = (alternativeId: string) => {
    if (showResults) return; // Não permitir alterações se já mostrou resultados
    
    setSelectedId(alternativeId);
    onAnswerSelected(question.id, alternativeId);
  };
  const getCorrectAlternativeId = () => {
    return question.alternatives.find(alt => alt.isCorrect)?.id;
  };
  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'Matemática':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Português':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
      case 'Química':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
      case 'Física':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Geografia':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  const totalAlternatives = question.alternatives.length;
  const answered = Boolean(selectedId);
  const correctAlternativeId = getCorrectAlternativeId();

  return (
    <article className="group relative mb-6 overflow-hidden card border-0 shadow-sm transition-transform duration-200 animate-fadeIn">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 opacity-70"></div>
      <header className="flex flex-col gap-3 border-b-0 bg-muted-bg/30 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-foreground/80">Questão {questionNumber}</h3>
          <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">{question.text}</p>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:flex-col md:items-end">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${getDisciplineColor(question.discipline)}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {question.discipline}
          </span>
          <span className="rounded-full bg-card-bg px-2 py-1 text-foreground/75 shadow-sm">
            {answered ? `Selecionada: alternativa ${selectedId}` : `${totalAlternatives} alternativas disponíveis`}
          </span>
        </div>
      </header>

      <section className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="space-y-3">
          {question.alternatives.map((alternative) => {
            const isSelected = selectedId === alternative.id;
            const isCorrectAlt = alternative.id === correctAlternativeId;
            const showAsCorrect = showResults && isCorrectAlt;
            const showAsWrong = showResults && isSelected && !isCorrectAlt;

            return (
              <button
                key={alternative.id}
                onClick={() => handleSelectAlternative(alternative.id)}
                disabled={showResults}
                type="button"
                className={`relative flex w-full flex-col gap-3 rounded-2xl border-0 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-center sm:gap-4 ${
                  isSelected && !showResults ? "bg-primary/5 shadow-md" : "bg-muted-bg/30 hover:bg-muted-bg/50"
                } ${showAsCorrect ? "bg-success/10" : ""} ${showAsWrong ? "bg-danger/10" : ""}`}
                aria-pressed={isSelected}
                aria-label={`Alternativa ${alternative.id}`}
              >
                <div className="flex w-full items-start gap-4">
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-0 text-sm font-semibold transition-colors sm:h-10 sm:w-10 ${
                    showAsCorrect
                      ? "bg-success text-white"
                      : showAsWrong
                        ? "bg-danger text-white"
                        : isSelected
                          ? "bg-primary text-white"
                          : "bg-card-bg text-foreground/70 shadow-sm"
                  }`}>
                    {alternative.id}
                  </span>
                  <span className="flex-1 pt-0 text-foreground sm:pt-1">{alternative.text}</span>
                </div>
                <span className="flex items-center gap-2 text-xs font-medium text-foreground/75 sm:ml-auto">
                  {showAsCorrect && (
                    <>
                      <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correta
                    </>
                  )}
                  {showAsWrong && (
                    <>
                      <svg className="h-4 w-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Sua escolha
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {showResults && (
          <div className={`mt-6 rounded-2xl border-0 p-5 text-sm leading-relaxed shadow-sm ${isCorrect ? "bg-success/10 text-success/90" : "bg-danger/10 text-danger/90"}`}>
            <h4 className="mb-2 flex items-center gap-2 text-base font-semibold">
              {isCorrect ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Excelente resposta!
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Reveja a explicação e tente novamente depois
                </>
              )}
            </h4>
            <p className="text-foreground/90">{question.explanation}</p>
          </div>
        )}
      </section>
    </article>
  );
}

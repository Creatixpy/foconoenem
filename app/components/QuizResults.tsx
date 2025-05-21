"use client";

import { QuizResult } from "@/types";

interface QuizResultsProps {
  result: QuizResult;
  onRetakeQuiz: () => void;
}

export default function QuizResults({ result, onRetakeQuiz }: QuizResultsProps) {
  
  const getScoreColor = (score: number) => {
    const percentage = (score / result.totalQuestions) * 100;
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-danger";
  };
  
  return (
    <div className="card p-6 border border-border-color animate-fadeIn">
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Resultado do Simulado</h2>
        
        <div className="inline-block mb-6">
          <div className="relative w-36 h-36">
            {/* Círculo de fundo */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-100 dark:border-gray-800"></div>
            
            {/* Círculo de progresso */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <circle 
                className="text-gray-100 dark:text-gray-800" 
                cx="50" 
                cy="50" 
                r="45" 
                strokeWidth="10" 
                stroke="currentColor" 
                fill="none" 
              />
              
              <circle 
                className={`${getScoreColor(result.score)} transition-all duration-1000 ease-out`}
                cx="50" 
                cy="50" 
                r="45" 
                strokeWidth="10" 
                stroke="currentColor" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={`${(result.score / result.totalQuestions) * 283} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            
            {/* Texto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </span>
                <span className="text-sm text-gray-500 block">
                  /{result.totalQuestions}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-success-light p-4 rounded-lg text-center">
            <div className="text-success font-bold text-3xl mb-1">
              {result.correctAnswers}
            </div>
            <div className="text-sm text-success-dark dark:text-success">
              Acertos
            </div>
          </div>
          
          <div className="bg-danger-light p-4 rounded-lg text-center">
            <div className="text-danger font-bold text-3xl mb-1">
              {result.wrongAnswers}
            </div>
            <div className="text-sm text-danger-dark dark:text-danger">
              Erros
            </div>
          </div>
          
          <div className="bg-warning-light p-4 rounded-lg text-center">
            <div className="text-warning font-bold text-3xl mb-1">
              {result.unansweredQuestions}
            </div>
            <div className="text-sm text-warning-dark dark:text-warning">
              Não respondidas
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button 
            onClick={onRetakeQuiz}
            className="theme-btn btn flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Fazer Novo Simulado
          </button>
        </div>
      </div>
    </div>
  );
}

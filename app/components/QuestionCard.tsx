"use client";

import { useState } from "react";
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
  
  return (
    <div className="card border border-border-color overflow-hidden mb-6 animate-fadeIn">
      <div className="p-4 bg-muted-bg border-b border-border-color">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            Questão {questionNumber}
          </h3>
          <span className={`text-xs font-medium py-1 px-2 rounded-full ${getDisciplineColor(question.discipline)}`}>
            {question.discipline}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <p className="mb-4 whitespace-pre-line">{question.text}</p>
        
        <div className="space-y-3 mb-4">
          {question.alternatives.map((alternative) => (
            <div 
              key={alternative.id}
              onClick={() => handleSelectAlternative(alternative.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                selectedId === alternative.id 
                  ? 'border-primary bg-primary-light' 
                  : 'border-border-color hover:bg-muted-bg'
              } ${
                showResults && alternative.isCorrect
                  ? 'border-success bg-success-light'
                  : showResults && selectedId === alternative.id && !alternative.isCorrect
                  ? 'border-danger bg-danger-light'
                  : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-medium text-sm ${
                selectedId === alternative.id
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground'
              } ${
                showResults && alternative.isCorrect
                  ? 'bg-success text-white'
                  : showResults && selectedId === alternative.id && !alternative.isCorrect
                  ? 'bg-danger text-white'
                  : ''
              }`}>
                {alternative.id}
              </div>
              <div className="flex-grow pt-1">{alternative.text}</div>
              
              {showResults && alternative.isCorrect && (
                <div className="flex-shrink-0 text-success">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {showResults && selectedId === alternative.id && !alternative.isCorrect && (
                <div className="flex-shrink-0 text-danger">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {showResults && (
          <div className={`mt-4 p-4 rounded-lg ${
            isCorrect 
              ? 'bg-success-light border border-success/30' 
              : 'bg-warning-light border border-warning/30'
          }`}>
            <h4 className={`font-medium ${isCorrect ? 'text-success' : 'text-warning'} flex items-center mb-2`}>
              {isCorrect ? (
                <>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resposta Correta!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {selectedId ? 'Resposta Incorreta' : 'Questão Não Respondida'}
                </>
              )}
            </h4>
            <p className="text-foreground text-sm">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

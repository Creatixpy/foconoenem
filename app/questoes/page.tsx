"use client";

import { useState, useEffect } from "react";
import { MultipleChoiceQuestion, QuizResult } from "@/types";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";

const subjectNames = {
  matematica: "Matemática",
  portugues: "Português",
  quimica: "Química",
  fisica: "Física",
  geografia: "Geografia"
};

// Constantes para controle de tempo
const QUESTION_COOLDOWN = 10 * 60 * 1000; // 10 minutos em milissegundos
const STORAGE_KEY = "questoes_cache";

export default function QuestoesPage() {
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isSystemAvailable, setIsSystemAvailable] = useState(isWithinOperatingHours());
  const [operatingInfo, setOperatingInfo] = useState(getOperatingHoursInfo());
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutos em segundos
  const [nextGenerationTime, setNextGenerationTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Função para carregar questões, seja do cache ou da API
  const loadQuestions = async (forceReload = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se temos questões em cache e se ainda estão dentro do período válido
      if (!forceReload) {
        const cachedData = localStorage.getItem(STORAGE_KEY);
        
        if (cachedData) {
          try {
            const { questions: cachedQuestions, timestamp, userAnswers: cachedAnswers = [] } = JSON.parse(cachedData);
            const currentTime = new Date().getTime();
            
            // Se o cache ainda é válido (menos de 10 minutos)
            if (cachedQuestions && cachedQuestions.length > 0 && currentTime - timestamp < QUESTION_COOLDOWN) {
              // Calcular quando poderá gerar novas questões
              const nextGenTime = timestamp + QUESTION_COOLDOWN;
              setNextGenerationTime(nextGenTime);
              setQuestions(cachedQuestions);
              
              // Restaurar respostas do usuário, se houver
              if (cachedAnswers.length === cachedQuestions.length) {
                setUserAnswers(cachedAnswers);
              } else {
                setUserAnswers(new Array(cachedQuestions.length).fill(null));
              }
              
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Erro ao parsear cache:", e);
            // Se houver erro ao ler o cache, ignoramos e buscamos novas questões
          }
        }
      }
      
      // Se não há cache válido ou forceReload é true, buscar da API
      const response = await fetch("/api/gerar-questoes");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Erro ao carregar questões");
      }
      
      const data = await response.json();
      
      // Armazenar as questões no estado
      setQuestions(data.questions);
      
      // Inicializar array de respostas com null para cada questão
      const newAnswers = new Array(data.questions.length).fill(null);
      setUserAnswers(newAnswers);
      
      // Salvar no localStorage com timestamp
      const cacheData = {
        questions: data.questions,
        timestamp: new Date().getTime(),
        userAnswers: newAnswers
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      
      // Definir o próximo horário de geração
      const nextGenTime = new Date().getTime() + QUESTION_COOLDOWN;
      setNextGenerationTime(nextGenTime);
      
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      setError(error instanceof Error ? error.message : "Erro ao carregar as questões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Efeito inicial para carregar questões
  useEffect(() => {
    if (isSystemAvailable) {
      loadQuestions();
    }
  }, [isSystemAvailable]);

  // Verificar o horário de funcionamento a cada minuto
  useEffect(() => {
    const checkAvailability = () => {
      setIsSystemAvailable(isWithinOperatingHours());
      setOperatingInfo(getOperatingHoursInfo());
    };
    
    const timer = setInterval(checkAvailability, 60000); // 60 segundos
    return () => clearInterval(timer);
  }, []);

  // Atualizar o contador de tempo para novas questões
  useEffect(() => {
    if (!nextGenerationTime) return;
    
    const updateCooldown = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, nextGenerationTime - now);
      
      if (remaining <= 0) {
        setCooldownRemaining(0);
        setNextGenerationTime(null);
      } else {
        setCooldownRemaining(Math.ceil(remaining / 1000)); // Converter para segundos
      }
    };
    
    // Atualizar imediatamente e depois a cada segundo
    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    
    return () => clearInterval(timer);
  }, [nextGenerationTime]);

  // Timer para o simulado
  useEffect(() => {
    if (!loading && questions.length > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(); // Submeter automaticamente quando o tempo acabar
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, questions, showResult]);

  // Atualizar o localStorage quando as respostas mudam
  useEffect(() => {
    if (questions.length > 0 && userAnswers.length === questions.length) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          parsedData.userAnswers = userAnswers;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
        }
      } catch (e) {
        console.error("Erro ao salvar respostas no cache:", e);
      }
    }
  }, [userAnswers, questions]);

  // Formatar o tempo restante
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Formatar o tempo de cooldown
  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Forçar nova geração de questões
  const handleForceRegenerate = () => {
    if (cooldownRemaining > 0) {
      if (!confirm(`Você precisa esperar mais ${formatCooldown(cooldownRemaining)} para gerar novas questões gratuitamente. Deseja continuar mesmo assim?`)) {
        return;
      }
    }
    
    // Reiniciar o simulado com novas questões
    loadQuestions(true);
    setCurrentQuestionIndex(0);
    setTimeRemaining(30 * 60); // Reiniciar o timer do simulado
    setShowResult(false);
    setQuizResult(null);
  };

  // Ir para a próxima questão
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Ir para a questão anterior
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Selecionar uma resposta
  const handleSelectAnswer = (optionIndex: number) => {
    console.log(`Selecionando resposta: ${optionIndex}`); // Adicionar log para debug
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
    
    // Forçar atualização da interface - podemos adicionar um feedback visual aqui
    const selectedOption = document.querySelector(`[data-option-index="${optionIndex}"]`);
    if (selectedOption) {
      // Aplicar brevemente uma classe adicional para feedback visual
      selectedOption.classList.add('animate-pulse');
      setTimeout(() => {
        selectedOption.classList.remove('animate-pulse');
      }, 300);
    }
  };

  // Submeter o simulado
  const handleSubmit = () => {
    // Verificar quantas questões foram respondidas
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    
    if (answeredCount < questions.length && timeRemaining > 0) {
      if (!confirm(`Você respondeu apenas ${answeredCount} de ${questions.length} questões. Deseja realmente finalizar o simulado?`)) {
        return;
      }
    }
    
    // Calcular resultados
    let correctCount = 0;
    
    const answeredQuestions = questions.map((question, index) => {
      const userAnswer = userAnswers[index] !== null ? userAnswers[index]! : -1;
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      return {
        question,
        userAnswer,
        isCorrect
      };
    });
    
    const result: QuizResult = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: questions.length - correctCount,
      score: Number(((correctCount / questions.length) * 100).toFixed(1)),
      answeredQuestions
    };
    
    setQuizResult(result);
    setShowResult(true);
  };

  // Reiniciar o simulado com as mesmas questões
  const handleRestartSameQuiz = () => {
    // Limpa as respostas mas mantém as mesmas questões
    setUserAnswers(new Array(questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setTimeRemaining(30 * 60); // Reiniciar o timer
    setShowResult(false);
    setQuizResult(null);
    
    // Atualizar o cache com as respostas limpas
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        parsedData.userAnswers = new Array(questions.length).fill(null);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      }
    } catch (e) {
      console.error("Erro ao resetar respostas no cache:", e);
    }
  };

  // Verificar se todas as questões foram respondidas
  const allQuestionsAnswered = userAnswers.every(answer => answer !== null);

  if (!isSystemAvailable) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 mx-auto text-warning mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4">Sistema Indisponível</h2>
            <p className="mb-6">{operatingInfo.message}</p>
            <p className="text-sm">O simulado de questões estará disponível novamente às {operatingInfo.opensAt} h.</p>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="loader mx-auto"></div>
            <p className="mt-4 text-xl">Gerando questões...</p>
            <p className="text-sm mt-2 text-gray-500">
              Estamos preparando questões de Matemática, Português, Química, Física e Geografia.
              Isso pode levar alguns instantes.
            </p>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 mx-auto text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-danger mb-4">Erro</h2>
            <p className="mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Tentar Novamente
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Exibir resultado do simulado
  if (showResult && quizResult) {
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

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        
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
                        className={`absolute bottom-0 left-0 right-0 ${getScoreBgColor(quizResult.score)}`} 
                        style={{height: `${quizResult.score}%`, transition: 'height 1s ease-out'}}
                      ></div>
                      <div className="relative z-10">
                        <div className={`text-5xl font-bold ${getScoreColor(quizResult.score)}`}>
                          {quizResult.score}%
                        </div>
                        <div className="text-xs mt-1 opacity-80">acertos</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-sm font-medium ${getScoreColor(quizResult.score)} bg-muted-bg py-1 px-3 rounded-full inline-block`}>
                    {quizResult.score >= 90 ? 'Excelente!' : 
                     quizResult.score >= 70 ? 'Muito bom!' : 
                     quizResult.score >= 50 ? 'Bom' :
                     quizResult.score >= 30 ? 'Regular' : 'Precisa melhorar'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:gap-6 text-center">
                  <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color relative overflow-hidden">
                    <div className="absolute inset-0 bg-success-light opacity-20" style={{width: `${(quizResult.correctAnswers/quizResult.totalQuestions)*100}%`}}></div>
                    <div className="relative">
                      <div className="text-3xl font-bold text-success">{quizResult.correctAnswers}</div>
                      <div className="text-sm">Acertos</div>
                    </div>
                  </div>
                  
                  <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color relative overflow-hidden">
                    <div className="absolute inset-0 bg-danger-light opacity-20" style={{width: `${(quizResult.wrongAnswers/quizResult.totalQuestions)*100}%`}}></div>
                    <div className="relative">
                      <div className="text-3xl font-bold text-danger">{quizResult.wrongAnswers}</div>
                      <div className="text-sm">Erros</div>
                    </div>
                  </div>
                  
                  <div className="bg-card-bg p-5 rounded-lg shadow-md border border-border-color col-span-2">
                    <div className="text-3xl font-bold">{quizResult.totalQuestions}</div>
                    <div className="text-sm">Total de questões</div>
                    
                    <div className="mt-3 w-full h-2 bg-muted-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success" 
                        style={{width: `${(quizResult.correctAnswers/quizResult.totalQuestions)*100}%`}}
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
                    Você respondeu {quizResult.answeredQuestions.filter(q => q.userAnswer !== -1).length} 
                    de {quizResult.totalQuestions} questões
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
              {quizResult.answeredQuestions.map((item, index) => (
                <div key={item.question.id} className="card overflow-hidden border border-border-color animate-fadeIn" style={{animationDelay: `${index * 0.05}s`}}>
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
              <button 
                onClick={handleRestartSameQuiz}
                className="btn btn-primary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refazer com Mesmas Questões
              </button>
              
              <button 
                onClick={handleForceRegenerate}
                className={`btn ${cooldownRemaining > 0 ? 'btn-outline' : 'btn-primary'} flex items-center group`}
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Gerar Novas Questões
                {cooldownRemaining > 0 && (
                  <span className="ml-1 text-xs bg-muted-bg py-0.5 px-1.5 rounded-full">
                    {formatCooldown(cooldownRemaining)}
                  </span>
                )}
              </button>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Exibir questões
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4 md:mb-0 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Simulado ENEM
            </h2>
            
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">Questão:</span>
                <span className="font-bold">{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
              
              <div className={`flex items-center gap-1 ${timeRemaining < 300 ? 'text-danger' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">{formatTime(timeRemaining)}</span>
              </div>
              
              <div className="text-xs px-2 py-1 bg-primary-light text-primary rounded-full">
                {subjectNames[currentQuestion.subject]}
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="text-lg mb-6">{currentQuestion.question}</div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    console.log(`Clique na opção: ${index}`);
                    handleSelectAnswer(index);
                  }}
                  data-option-index={index}
                  className={`w-full text-left p-4 rounded-lg border cursor-pointer transition-colors ${
                    userAnswers[currentQuestionIndex] === index 
                      ? 'bg-primary-light border-primary border-2 shadow-md' 
                      : 'bg-card-bg border-border-color hover:bg-muted-bg'
                  }`}
                  role="button"
                  aria-pressed={userAnswers[currentQuestionIndex] === index}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectAnswer(index);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-2 font-bold flex-shrink-0">{String.fromCharCode(65 + index)}.</div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`btn btn-outline flex items-center ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            
            <div className="flex gap-2">
              {cooldownRemaining > 0 && (
                <div className="hidden md:flex items-center text-xs text-gray-500 mr-4">
                  <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Novas questões em: {formatCooldown(cooldownRemaining)}
                </div>
              )}
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-primary flex items-center"
                >
                  Próxima
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className={`btn theme-btn ${!allQuestionsAnswered ? 'relative' : ''}`}
                >
                  Finalizar Simulado
                  {!allQuestionsAnswered && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
        
        <section className="card p-4 md:p-6 mb-8 border border-border-color">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h3 className="font-semibold mb-2 md:mb-0 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Navegação Rápida
            </h3>
            
            {cooldownRemaining > 0 && (
              <div className="text-xs text-gray-500 flex items-center bg-muted-bg py-1 px-2 rounded-full">
                <svg className="w-3.5 h-3.5 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Novas questões em: {formatCooldown(cooldownRemaining)}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-full py-3 px-2 text-center rounded-md transition-all shadow hover:shadow-md ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-white font-bold'
                    : userAnswers[index] !== null
                    ? 'bg-success-light text-success border border-success/30 font-medium'
                    : 'bg-muted-bg hover:bg-secondary border border-border-color'
                }`}
                style={
                  index === currentQuestionIndex
                    ? {backgroundColor: "var(--primary)", color: "white"} 
                    : userAnswers[index] !== null
                    ? {backgroundColor: "var(--success-light)", color: "var(--success)", borderColor: "rgba(var(--success), 0.3)"}
                    : {backgroundColor: "var(--muted-bg)", borderColor: "var(--border-color)"}
                }
                aria-label={`Ir para questão ${index + 1}`}
                title={
                  index === currentQuestionIndex 
                    ? `Questão atual: ${index + 1}` 
                    : userAnswers[index] !== null 
                    ? `Questão ${index + 1} (respondida)` 
                    : `Ir para questão ${index + 1}`
                }
              >
                <span className="text-base">{index + 1}</span>
                {userAnswers[index] !== null && index !== currentQuestionIndex && (
                  <div className="w-2 h-2 bg-success rounded-full mx-auto mt-1" style={{backgroundColor: "var(--success)"}}></div>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-center text-gray-500">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-md bg-primary mr-1" style={{backgroundColor: "var(--primary)"}}></div>
                <span>Atual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-md bg-success-light border border-success/30 mr-1" style={{backgroundColor: "var(--success-light)", borderColor: "rgba(var(--success), 0.3)"}}></div>
                <span>Respondida</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-md bg-muted-bg border border-border-color mr-1" style={{backgroundColor: "var(--muted-bg)", borderColor: "var(--border-color)"}}></div>
                <span>Não respondida</span>
              </div>
            </div>
          </div>
          
          {/* Botão para forçar a geração de novas questões */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleForceRegenerate}
              disabled={loading}
              className={`text-sm px-3 py-1.5 rounded-md flex items-center ${
                cooldownRemaining > 0 
                  ? 'bg-muted-bg text-gray-600 hover:bg-secondary' 
                  : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
              } transition-colors`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {cooldownRemaining > 0 
                ? `Gerar Novas Questões (${formatCooldown(cooldownRemaining)})` 
                : 'Gerar Novas Questões'
              }
            </button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

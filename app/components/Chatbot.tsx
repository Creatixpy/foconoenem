"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Olá! Sou o assistente virtual do Foco no ENEM. Posso responder suas dúvidas sobre o ENEM e educação. Como posso ajudar?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar sua pergunta");
      }

      if (data.offtopic) {
        setError("Por favor, faça apenas perguntas relacionadas ao ENEM ou educação.");
        setIsLoading(false);
        return;
      }

      // Adicionar resposta do bot
      const botMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro no chatbot:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao processar sua pergunta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão do chatbot */}
      <button
        aria-label="Abrir chat de assistência"
        onClick={toggleChat}
        className="fixed bottom-4 left-4 z-10 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all duration-300 flex items-center justify-center"
      >
        {isOpen ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Interface do chatbot */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-10 w-80 md:w-96 bg-card-bg border-2 border-primary rounded-lg shadow-lg flex flex-col animate-fadeIn" style={{ maxHeight: "calc(100vh - 150px)" }}>
          {/* Cabeçalho */}
          <div className="bg-primary text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg 
                className="w-6 h-6 mr-2" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Assistente ENEM</h3>
            </div>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200"
              aria-label="Fechar chat"
            >
              <svg 
                className="w-5 h-5" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Corpo da conversa */}
          <div className="flex-grow overflow-y-auto p-3 bg-white dark:bg-gray-800" style={{ maxHeight: "350px" }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${
                  message.isBot ? "text-left" : "text-right"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.isBot
                      ? "bg-gray-100 dark:bg-gray-700 text-foreground border border-gray-200 dark:border-gray-600"
                      : "bg-primary text-white"
                  }`}
                >
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block bg-gray-100 dark:bg-gray-700 text-foreground p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="text-center mb-3">
                <div className="inline-block bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 p-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800">
                  {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Formulário de envio */}
          <form onSubmit={handleSubmit} className="border-t-2 border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="flex-grow p-2 border-2 border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Faça uma pergunta sobre o ENEM..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-primary text-white p-2 rounded-r-lg hover:bg-primary-dark disabled:bg-gray-400 border-2 border-primary"
                disabled={isLoading || !inputValue.trim()}
              >
                <svg 
                  className="w-5 h-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 px-2">
              Pergunte apenas sobre o ENEM, vestibular e educação.
            </p>
          </form>
        </div>
      )}
    </>
  );
}

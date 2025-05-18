"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import { isWithinOperatingHours, getOperatingHoursInfo, isWithinOperatingHoursServer, getOperatingHoursInfoServer } from "@/lib/schedule";

export default function RedacaoPage() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"padrao" | "personalizado" | "gerado">("padrao");
  const [customTheme, setCustomTheme] = useState("");
  const [customText1, setCustomText1] = useState("");
  const [customText2, setCustomText2] = useState("");
  const [generatedTheme, setGeneratedTheme] = useState("");
  const [generatedText1, setGeneratedText1] = useState("");
  const [generatedText2, setGeneratedText2] = useState("");
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [isSystemAvailable, setIsSystemAvailable] = useState(true); // Iniciar como true e verificar com o servidor
  const [operatingInfo, setOperatingInfo] = useState(getOperatingHoursInfo());
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  // Verificar disponibilidade do sistema com o servidor
  const checkServerAvailability = async () => {
    try {
      setIsCheckingServer(true);
      const isAvailable = await isWithinOperatingHoursServer();
      const serverInfo = await getOperatingHoursInfoServer();
      
      setIsSystemAvailable(isAvailable);
      setOperatingInfo(serverInfo);
      setIsCheckingServer(false);
    } catch (error) {
      console.error("Erro ao verificar disponibilidade com o servidor:", error);
      // Fallback para verificação local
      setIsSystemAvailable(isWithinOperatingHours());
      setOperatingInfo(getOperatingHoursInfo());
      setIsCheckingServer(false);
    }
  };

  // Verificar a disponibilidade ao montar o componente
  useEffect(() => {
    checkServerAvailability();
    
    // Verificar o horário a cada minuto
    const timer = setInterval(() => {
      checkServerAvailability();
    }, 60000); // 60 segundos
    
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    // Verificar novamente com o servidor antes de submeter
    try {
      const isAvailable = await isWithinOperatingHoursServer();
      const serverInfo = await getOperatingHoursInfoServer();
      
      if (!isAvailable) {
        setError(`Sistema fora do horário de funcionamento. Disponível das ${serverInfo.opensAt} às ${serverInfo.closesAt}. Hora do servidor: ${serverInfo.serverTime}`);
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar horário do servidor:", error);
      // Se não conseguir verificar com o servidor, impedir o envio por segurança
      setError("Não foi possível verificar o horário do servidor. Tente novamente em instantes.");
      return;
    }
    
    if (content.trim().length < 50) {
      alert("Sua redação é muito curta. Por favor, desenvolva mais o texto.");
      return;
    }

    if (themeMode === "personalizado" && customTheme.trim().length < 5) {
      alert("Por favor, informe um tema personalizado válido com pelo menos 5 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload: {
        redacao: string;
        usarTemaPadrao?: boolean;
        tema?: string;
        textoApoio1?: string;
        textoApoio2?: string;
      } = {
        redacao: content
      };

      if (themeMode === "padrao") {
        payload.usarTemaPadrao = true;
      } else if (themeMode === "personalizado") {
        payload.usarTemaPadrao = false;
        payload.tema = customTheme.trim();
        
        if (customText1.trim()) {
          payload.textoApoio1 = customText1.trim();
        }
        
        if (customText2.trim()) {
          payload.textoApoio2 = customText2.trim();
        }
      } else if (themeMode === "gerado") {
        payload.usarTemaPadrao = false;
        payload.tema = generatedTheme;
        payload.textoApoio1 = generatedText1;
        payload.textoApoio2 = generatedText2;
      }
      
      const response = await fetch("/api/corrigir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro ao enviar redação");
      }
      
      // Salvar o ID da redação e redirecionar para a página de resultados
      localStorage.setItem("lastEssayId", data.id);
      router.push(`/resultados/${data.id}`);
      
    } catch (error) {
      console.error("Erro:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar sua redação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para gerar um tema automaticamente
  const handleGenerateTheme = async () => {
    // Verificar novamente com o servidor antes de gerar tema
    try {
      const isAvailable = await isWithinOperatingHoursServer();
      const serverInfo = await getOperatingHoursInfoServer();
      
      if (!isAvailable) {
        setError(`Sistema fora do horário de funcionamento. Disponível das ${serverInfo.opensAt} às ${serverInfo.closesAt}. Hora do servidor: ${serverInfo.serverTime}`);
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar horário do servidor:", error);
      setError("Não foi possível verificar o horário do servidor. Tente novamente em instantes.");
      return;
    }
    
    try {
      setIsGeneratingTheme(true);
      setError(null);
      
      const response = await fetch("/api/gerar-tema");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Não foi possível gerar um tema. Tente novamente.");
      }
      
      const data = await response.json();
      
      // Armazenar os dados gerados
      setGeneratedTheme(data.tema);
      setGeneratedText1(data.textoApoio1);
      setGeneratedText2(data.textoApoio2);
      
      // Mudar para o modo de tema gerado
      setThemeMode("gerado");
      
    } catch (error) {
      console.error("Erro ao gerar tema:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao gerar o tema. Por favor, tente novamente.");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Simulado de Redação do ENEM
          </h2>
          
          <div className="mb-8">
            <div className="flex flex-wrap items-center mb-4">
              <h3 className="font-semibold text-lg mr-4 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                SELECIONE O TEMA:
              </h3>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center cursor-pointer rounded-full px-4 py-2 hover:bg-muted-bg transition-colors">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary"
                    checked={themeMode === "padrao"}
                    onChange={() => setThemeMode("padrao")}
                  />
                  <span className="ml-2">Tema padrão</span>
                </label>
                <label className="inline-flex items-center cursor-pointer rounded-full px-4 py-2 hover:bg-muted-bg transition-colors">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary"
                    checked={themeMode === "personalizado"}
                    onChange={() => setThemeMode("personalizado")}
                  />
                  <span className="ml-2">Definir tema personalizado</span>
                </label>
                <button
                  onClick={handleGenerateTheme}
                  disabled={isGeneratingTheme}
                  className="theme-btn py-2 px-4 rounded-md text-sm flex items-center shadow-sm"
                >
                  {isGeneratingTheme ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Gerar Tema Automático
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mostrar tema de acordo com o modo selecionado */}
          {themeMode === "padrao" && (
            <>
              <div className="mb-6 theme-box">
                <h3 className="font-semibold text-lg mb-2 text-foreground">TEMA:</h3>
                <p className="theme-text">
                  "Os desafios da educação digital no Brasil contemporâneo"
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-foreground">TEXTOS DE APOIO:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="support-text-box">
                    <p className="support-text-title">
                      <strong>TEXTO I</strong>
                    </p>
                    <p className="support-text-content">
                      Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, 
                      porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, 
                      e em famílias de baixa renda, o acesso é significativamente menor.
                    </p>
                  </div>
                  <div className="support-text-box">
                    <p className="support-text-title">
                      <strong>TEXTO II</strong>
                    </p>
                    <p className="support-text-content">
                      A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, 
                      mas também mostrou que muitos estudantes e professores não estão preparados para 
                      o uso efetivo das tecnologias educacionais.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {themeMode === "gerado" && (
            <>
              <div className="mb-6 theme-box">
                <h3 className="font-semibold text-lg mb-2 text-foreground">TEMA GERADO:</h3>
                <p className="theme-text">
                  "{generatedTheme}"
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 text-foreground">TEXTOS DE APOIO:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="support-text-box">
                    <p className="support-text-title">
                      <strong>TEXTO I</strong>
                    </p>
                    <p className="support-text-content">{generatedText1}</p>
                  </div>
                  <div className="support-text-box">
                    <p className="support-text-title">
                      <strong>TEXTO II</strong>
                    </p>
                    <p className="support-text-content">{generatedText2}</p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {themeMode === "personalizado" && (
            <>
              <div className="mb-6">
                <label className="block">
                  <h3 className="font-semibold text-lg mb-2">TEMA PERSONALIZADO:</h3>
                  <input 
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Digite o tema da redação..."
                    className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  />
                </label>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">TEXTOS DE APOIO PERSONALIZADOS (OPCIONAL):</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">
                      <span className="text-sm font-medium">TEXTO I</span>
                      <textarea
                        rows={4}
                        value={customText1}
                        onChange={(e) => setCustomText1(e.target.value)}
                        placeholder="Digite o primeiro texto de apoio (opcional)..."
                        className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500 transition-colors"
                      ></textarea>
                    </label>
                  </div>
                  <div>
                    <label className="block mb-2">
                      <span className="text-sm font-medium">TEXTO II</span>
                      <textarea
                        rows={4}
                        value={customText2}
                        onChange={(e) => setCustomText2(e.target.value)}
                        placeholder="Digite o segundo texto de apoio (opcional)..."
                        className="w-full mt-1 p-3 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500 transition-colors"
                      ></textarea>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="mb-8 p-4 bg-primary-light rounded-lg border border-border-color">
            <h3 className="font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              INSTRUÇÕES:
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija um texto dissertativo-argumentativo sobre o tema proposto.</li>
              <li>Apresente proposta de intervenção que respeite os direitos humanos.</li>
              <li>Dê um título à sua redação.</li>
              <li>Seu texto deve ter entre 7 e 30 linhas.</li>
            </ul>
          </div>

          {isCheckingServer && (
            <div className="bg-primary-light p-3 rounded-lg mb-4 text-center">
              <span className="inline-block w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              Verificando disponibilidade do sistema...
            </div>
          )}
          
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

          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              SUA REDAÇÃO:
            </h3>
            <div
              ref={editorRef}
              className="editor-container"
              contentEditable
              onInput={handleInput}
              data-placeholder="Digite seu texto aqui..."
              aria-label="Editor de redação"
            ></div>
            <div className="char-counter">
              {content.length} caracteres | Aproximadamente {Math.ceil(content.length / 80)} linhas
              {content.length >= 2500 && 
                <span className="text-danger ml-2">
                  (Limite de caracteres atingido!)
                </span>
              }
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isSystemAvailable || isCheckingServer}
              className={`${isSubmitting || !isSystemAvailable || isCheckingServer ? "bg-gray-400" : ""} theme-btn btn`}
              title={!isSystemAvailable ? `Sistema disponível apenas das ${operatingInfo.opensAt} às ${operatingInfo.closesAt}` : ""}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Enviando...
                </>
              ) : isCheckingServer ? (
                <>
                  Verificando Horário...
                </>
              ) : !isSystemAvailable ? (
                <>
                  Sistema Indisponível
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              ) : (
                <>
                  Concluir Redação
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

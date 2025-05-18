"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  const handleSubmit = async () => {
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
    try {
      setIsGeneratingTheme(true);
      setError(null);
      
      const response = await fetch("/api/gerar-tema");
      
      if (!response.ok) {
        throw new Error("Não foi possível gerar um tema. Tente novamente.");
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
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Foco no ENEM</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/redacao" className="hover:underline">
                  Simulado
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            Simulado de Redação do ENEM
          </h2>
          
          <div className="mb-6">
            <div className="flex flex-wrap items-center mb-4">
              <h3 className="font-semibold text-lg mr-4 mb-2">SELECIONE O TEMA:</h3>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={themeMode === "padrao"}
                    onChange={() => setThemeMode("padrao")}
                  />
                  <span className="ml-2">Tema padrão</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={themeMode === "personalizado"}
                    onChange={() => setThemeMode("personalizado")}
                  />
                  <span className="ml-2">Definir tema personalizado</span>
                </label>
                <button
                  onClick={handleGenerateTheme}
                  disabled={isGeneratingTheme}
                  className={`${
                    isGeneratingTheme ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  } text-white font-medium py-2 px-4 rounded-md transition duration-200 text-sm flex items-center`}
                >
                  {isGeneratingTheme ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Gerar Tema Automático
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {themeMode === "padrao" && (
            <>
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">TEMA:</h3>
                <p className="text-lg">
                  "Os desafios da educação digital no Brasil contemporâneo"
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">TEXTOS DE APOIO:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm mb-2">
                      <strong>TEXTO I</strong>
                    </p>
                    <p className="text-sm">
                      Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, 
                      porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, 
                      e em famílias de baixa renda, o acesso é significativamente menor.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm mb-2">
                      <strong>TEXTO II</strong>
                    </p>
                    <p className="text-sm">
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
              <div className="mb-6 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">TEMA GERADO:</h3>
                <p className="text-lg">
                  "{generatedTheme}"
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">TEXTOS DE APOIO:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm mb-2">
                      <strong>TEXTO I</strong>
                    </p>
                    <p className="text-sm">{generatedText1}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm mb-2">
                      <strong>TEXTO II</strong>
                    </p>
                    <p className="text-sm">{generatedText2}</p>
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
          
          <div className="mb-6">
            <h3 className="font-semibold mb-4">INSTRUÇÕES:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija um texto dissertativo-argumentativo sobre o tema proposto.</li>
              <li>Apresente proposta de intervenção que respeite os direitos humanos.</li>
              <li>Dê um título à sua redação.</li>
              <li>Seu texto deve ter entre 7 e 30 linhas.</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Erro:</p>
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">SUA REDAÇÃO:</h3>
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
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${
                isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white font-medium py-3 px-6 rounded-full inline-block transition duration-200`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Enviando...
                </>
              ) : (
                "Concluir Redação"
              )}
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RedacaoPage() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/corrigir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redacao: content }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar redação");
      }

      const data = await response.json();
      
      // Salvar o ID da redação e redirecionar para a página de resultados
      localStorage.setItem("lastEssayId", data.id);
      router.push(`/resultados/${data.id}`);
      
    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao enviar sua redação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
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
          
          <div className="mb-6">
            <h3 className="font-semibold mb-4">INSTRUÇÕES:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija um texto dissertativo-argumentativo sobre o tema proposto.</li>
              <li>Apresente proposta de intervenção que respeite os direitos humanos.</li>
              <li>Dê um título à sua redação.</li>
              <li>Seu texto deve ter entre 7 e 30 linhas.</li>
            </ul>
          </div>

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
              {isSubmitting ? "Enviando..." : "Concluir Redação"}
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { verificarStatusDestaques } from "@/lib/supabase";

export default function AdminDestaques() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [statusDestaques, setStatusDestaques] = useState<{
    ultimaAtualizacao: string | null;
    proxima: string | null;
    status: string;
  } | null>(null);
  const [senha, setSenha] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar status inicial
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const status = await verificarStatusDestaques();
        setStatusDestaques(status);
      } catch (error) {
        console.error("Erro ao carregar status de destaques:", error);
      }
    };

    verificarStatus();
  }, []);

  // Formatar data para exibição
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "Não disponível";
    
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar senha
  const handleVerificarSenha = () => {
    // Senha simples para demonstração. Em produção, use um sistema de autenticação mais seguro
    const senhaPadrao = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "focoenem2026";
    
    if (senha === senhaPadrao) {
      setAutorizado(true);
      setErro(null);
    } else {
      setErro("Senha incorreta");
    }
  };

  // Acionar atualização manual
  const handleAtualizarDestaques = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/atualizarDestaques');
      const data = await response.json();
      
      setResult(data);
      
      // Recarregar status após atualização
      const novoStatus = await verificarStatusDestaques();
      setStatusDestaques(novoStatus);
    } catch (error) {
      console.error("Erro ao atualizar destaques:", error);
      setResult({
        status: "error",
        message: "Falha ao processar a requisição"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/noticias" className="text-primary hover:underline flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para notícias
          </Link>
        </div>
        
        <div className="card p-6 md:p-8 border border-border-color">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Administração de Destaques
          </h1>
          
          {!autorizado ? (
            <div className="bg-muted-bg p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
              <p className="mb-4">Por favor, digite a senha para acessar esta área:</p>
              
              {erro && (
                <div className="bg-danger-light text-danger p-3 rounded-lg mb-4">
                  {erro}
                </div>
              )}
              
              <div className="flex">
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite a senha"
                  className="flex-grow p-2 border border-border-color rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleVerificarSenha}
                  className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark"
                >
                  Acessar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted-bg p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Status Atual dos Destaques</h2>
                <div className="space-y-2">
                  <p>
                    <strong>Última Atualização:</strong> {statusDestaques?.ultimaAtualizacao 
                      ? formatarData(statusDestaques.ultimaAtualizacao) 
                      : "Nunca atualizado"
                    }
                  </p>
                  <p>
                    <strong>Próxima Atualização Automática:</strong> {statusDestaques?.proxima 
                      ? formatarData(statusDestaques.proxima) 
                      : "Não definido"
                    }
                  </p>
                  <p>
                    <strong>Status:</strong> {" "}
                    <span className={`
                      ${statusDestaques?.status === 'updated' ? 'text-success' : ''}
                      ${statusDestaques?.status === 'pending' ? 'text-warning' : ''}
                      ${statusDestaques?.status === 'error' || statusDestaques?.status === 'never' ? 'text-danger' : ''}
                    `}>
                      {statusDestaques?.status === 'updated' && "Atualizado"}
                      {statusDestaques?.status === 'pending' && "Atualização Pendente"}
                      {statusDestaques?.status === 'error' && "Erro na Atualização"}
                      {statusDestaques?.status === 'never' && "Nunca Atualizado"}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Atualização Manual</h2>
                <p className="mb-4">
                  Clique no botão abaixo para acionar a atualização dos destaques manualmente.
                  Normalmente, esse processo ocorre automaticamente a cada 12 horas.
                </p>
                <button
                  onClick={handleAtualizarDestaques}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Atualizar Destaques
                    </>
                  )}
                </button>
              </div>
              
              {result && (
                <div className={`p-4 rounded-lg mb-6 ${
                  result.status === "success" ? "bg-success-light text-success" : 
                  result.status === "error" ? "bg-danger-light text-danger" : 
                  "bg-warning-light text-warning"
                }`}>
                  <h3 className="font-semibold mb-2">Resultado da Operação</h3>
                  <p>{result.message}</p>
                  {result.destaques && (
                    <div className="mt-3">
                      <p className="font-semibold">IDs dos destaques selecionados:</p>
                      <ul className="mt-1 list-disc list-inside">
                        {result.destaques.map((id: string) => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-warning-light text-warning p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Importante!</h3>
                <p>
                  Este sistema usa IA para selecionar automaticamente até 5 notícias para destaque com base em relevância,
                  atualidade e interesse para estudantes do ENEM. A atualização automática ocorre a cada 12 horas.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

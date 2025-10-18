"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OperatingHoursIndicator from "../components/OperatingHoursIndicator";
import { getOperatingHoursInfo, type OperatingHoursInfo } from "@/lib/schedule";
import { supabase } from "@/lib/supabase";

const heroStats = [
  {
    label: "Tempo sugerido",
    value: "50 min",
    detail: "planejamento, redação e revisão",
  },
  {
    label: "Correção imediata",
    value: "IA + critérios ENEM",
    detail: "feedback por competência",
  },
  {
    label: "Textos de apoio",
    value: "2 fontes",
    detail: "dados atuais para reforçar argumentos",
  },
];

const guidanceSteps = [
  "Leia o tema com atenção e identifique o problema central a ser resolvido.",
  "Defina a tese e os argumentos principais antes de iniciar a escrita.",
  "Construa cada parágrafo com repertórios confiáveis e conexões claras.",
  "Finalize com uma proposta de intervenção completa, viável e humanizada.",
];

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
  const [isSystemAvailable, setIsSystemAvailable] = useState<boolean | null>(null);
  const [operatingInfo, setOperatingInfo] = useState<OperatingHoursInfo | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  const fetchOperatingInfo = useCallback(async () => {
    try {
      return await getOperatingHoursInfo();
    } catch (error) {
      console.error("Erro ao atualizar horário de funcionamento:", error);
      return null;
    }
  }, []);

  const applyOperatingInfo = useCallback((info: OperatingHoursInfo | null) => {
    if (!info) return;
    setOperatingInfo(info);
    setIsSystemAvailable(info.isOpen);
  }, []);

  const handleSubmit = async () => {
    const info = operatingInfo ?? (await fetchOperatingInfo());
    applyOperatingInfo(info);

    if (!info?.isOpen) {
      setError(
        info
          ? `Sistema fora do horário de funcionamento. Disponível das ${info.opensAt} às ${info.closesAt}.`
          : "Não foi possível confirmar o horário de funcionamento. Tente novamente em instantes."
      );
      return;
    }

    if (content.trim().length < 50) {
      alert("Sua redação é muito curta. Desenvolva mais o texto antes de enviar.");
      return;
    }

    if (themeMode === "personalizado" && customTheme.trim().length < 5) {
      alert("Informe um tema personalizado válido (mínimo 5 caracteres).");
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
      } = { redacao: content };

      if (themeMode === "padrao") {
        payload.usarTemaPadrao = true;
      } else if (themeMode === "personalizado") {
        payload.usarTemaPadrao = false;
        payload.tema = customTheme.trim();
        if (customText1.trim()) payload.textoApoio1 = customText1.trim();
        if (customText2.trim()) payload.textoApoio2 = customText2.trim();
      } else if (themeMode === "gerado") {
        payload.usarTemaPadrao = false;
        payload.tema = generatedTheme;
        payload.textoApoio1 = generatedText1;
        payload.textoApoio2 = generatedText2;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/corrigir", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro ao enviar redação");
      }

      localStorage.setItem("lastEssayId", data.id);
      router.push(`/resultados/${data.id}`);
    } catch (error) {
      console.error("Erro:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar sua redação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const updateInfo = async () => {
      const info = await fetchOperatingInfo();
      if (!cancelled) {
        applyOperatingInfo(info);
      }
    };

    void updateInfo();

    const timer = setInterval(() => {
      void updateInfo();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [applyOperatingInfo, fetchOperatingInfo]);

  const handleGenerateTheme = async () => {
    const info = operatingInfo ?? (await fetchOperatingInfo());
    applyOperatingInfo(info);

    if (!info?.isOpen) {
      setError(
        info
          ? `Sistema fora do horário de funcionamento. Disponível das ${info.opensAt} às ${info.closesAt}.`
          : "Não foi possível confirmar o horário de funcionamento. Tente novamente em instantes."
      );
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
      setGeneratedTheme(data.tema);
      setGeneratedText1(data.textoApoio1);
      setGeneratedText2(data.textoApoio2);
      setThemeMode("gerado");
    } catch (error) {
      console.error("Erro ao gerar tema:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao gerar o tema. Por favor, tente novamente.");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const renderThemeContent = () => {
    if (themeMode === "personalizado") {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground/80">
              Tema personalizado
              <input
                type="text"
                value={customTheme}
                onChange={(event) => setCustomTheme(event.target.value)}
                placeholder="Digite o tema da redação..."
                className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/80">Textos de apoio (opcional)</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm text-foreground/70">
                TEXTO I
                <textarea
                  rows={4}
                  value={customText1}
                  onChange={(event) => setCustomText1(event.target.value)}
                  placeholder="Cole dados, citações ou estudos que deseja usar como referência."
                  className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col text-sm text-foreground/70">
                TEXTO II
                <textarea
                  rows={4}
                  value={customText2}
                  onChange={(event) => setCustomText2(event.target.value)}
                  placeholder="Adicione outro ponto de vista ou estatística relevante."
                  className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          </div>
        </div>
      );
    }

    const themeTitle =
      themeMode === "gerado"
        ? generatedTheme || "Tema em geração..."
        : "Os desafios da educação digital no Brasil contemporâneo";
    const supportTexts =
      themeMode === "gerado"
        ? [
            {
              title: "Texto I",
              content:
                generatedText1 ||
                "Gerando texto de apoio. Caso demore, clique novamente em gerar tema para tentar uma nova proposta.",
            },
            {
              title: "Texto II",
              content:
                generatedText2 ||
                "Gerando texto de apoio. Caso demore, clique novamente em gerar tema para tentar uma nova proposta.",
            },
          ]
        : [
            {
              title: "Texto I",
              content:
                "Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grandes disparidades regionais e socioeconômicas. Nas regiões Norte e Nordeste, e entre famílias de baixa renda, o acesso é significativamente menor.",
            },
            {
              title: "Texto II",
              content:
                "A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.",
            },
          ];

    return (
      <div className="space-y-6">
        <div className="surface-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            {themeMode === "gerado" ? "Tema gerado automaticamente" : "Tema padrão"}
          </p>
          <p className="mt-3 text-xl font-semibold leading-relaxed text-foreground">&ldquo;{themeTitle}&rdquo;</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {supportTexts.map((support) => (
            <div key={support.title} className="surface-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{support.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{support.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-page-gradient text-foreground">
      <Header />
      <OperatingHoursIndicator />

      <main className="flex-grow">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="space-y-8">
                <div className="hero-status shadow-glow">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Simulado de redação disponível
                </div>
                <div className="space-y-5">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                    Domine o texto dissertativo com orientação inteligente.
                  </h1>
                  <p className="max-w-xl text-lg text-foreground/75">
                    Escolha ou gere temas atuais, escreva com apoio de textos motivadores e receba correções alinhadas aos cinco
                    critérios oficiais do ENEM.
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="stat-card px-5 py-4">
                      <dt className="text-xs uppercase tracking-wide text-foreground/60">{stat.label}</dt>
                      <dd className="mt-2 text-xl font-semibold text-primary">{stat.value}</dd>
                      <p className="mt-1 text-xs text-foreground/60">{stat.detail}</p>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="surface-card flex h-full flex-col gap-6 p-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Como transformar prática em nota alta</h2>
                  <ol className="mt-4 space-y-4 text-sm text-foreground/75">
                    {guidanceSteps.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-2xl border border-border-color/60 bg-card-bg/80 p-4 text-sm text-foreground/70 shadow-inner backdrop-blur">
                  {operatingInfo ? (
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-foreground">
                        {isSystemAvailable ? "Estamos corrigindo redações agora." : "Correções indisponíveis no momento."}
                      </p>
                      <p>
                        Horário de funcionamento: {operatingInfo.opensAt} às {operatingInfo.closesAt}. Envie seu texto e receba
                        análise completa em poucos segundos.
                      </p>
                    </div>
                  ) : (
                    <p>Verificando disponibilidade do simulador...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl space-y-10">
            <div className="surface-card space-y-6 p-6 shadow-xl md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Selecione o tema</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">Escolha como quer praticar hoje</h2>
                  <p className="mt-2 text-sm text-foreground/70">
                    Treine com o tema padrão, personalize sua proposta ou gere uma nova com inteligência artificial.
                  </p>
                </div>
                <button
                  onClick={handleGenerateTheme}
                  disabled={isGeneratingTheme}
                  className="btn btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingTheme ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Gerando tema...
                    </span>
                  ) : (
                    <>
                      Gerar tema com IA
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className={`radio-pill ${themeMode === "padrao" ? "radio-pill--active" : ""}`}>
                  <input
                    type="radio"
                    name="tema"
                    value="padrao"
                    checked={themeMode === "padrao"}
                    onChange={() => setThemeMode("padrao")}
                  />
                  <span>Tema padrão</span>
                </label>
                <label className={`radio-pill ${themeMode === "personalizado" ? "radio-pill--active" : ""}`}>
                  <input
                    type="radio"
                    name="tema"
                    value="personalizado"
                    checked={themeMode === "personalizado"}
                    onChange={() => setThemeMode("personalizado")}
                  />
                  <span>Definir tema personalizado</span>
                </label>
                <label className={`radio-pill ${themeMode === "gerado" ? "radio-pill--active" : ""}`}>
                  <input
                    type="radio"
                    name="tema"
                    value="gerado"
                    checked={themeMode === "gerado"}
                    onChange={() => setThemeMode("gerado")}
                  />
                  <span>Usar tema gerado automaticamente</span>
                </label>
              </div>

              {renderThemeContent()}
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="surface-card space-y-4 p-6 shadow-xl md:p-8">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-foreground">Checklist para uma redação nota mil</h3>
                </div>
                <ul className="space-y-3 text-sm text-foreground/75">
                  <li>🧭 Apresente uma tese clara no primeiro parágrafo e retome-a na conclusão.</li>
                  <li>🧠 Use repertórios legitimados para sustentar cada argumento (dados, autores, fatos históricos).</li>
                  <li>🧩 Construa parágrafos coesos com conectivos, progressão lógica e análise crítica.</li>
                  <li>🤝 Proponha intervenção completa: agente, ação, meio, finalidade e detalhamento.</li>
                </ul>
                {error && (
                  <div className="rounded-2xl border border-danger/20 bg-danger-light/30 p-4 text-sm text-danger">
                    <p className="font-semibold">Não conseguimos prosseguir:</p>
                    <p className="mt-1">{error}</p>
                  </div>
                )}
              </div>

              <div className="surface-card space-y-5 p-6 shadow-xl md:p-8">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-foreground">Sua redação</h3>
                </div>
                <div
                  ref={editorRef}
                  className="editor-container"
                  contentEditable
                  onInput={handleInput}
                  data-placeholder="Organize seus argumentos, conecte as ideias e finalize com uma intervenção transformadora."
                  aria-label="Editor de redação"
                ></div>
                <div className="char-counter">
                  {content.length} caracteres · ~{Math.ceil(content.length / 80)} linhas
                  {content.length >= 2500 && <span className="text-danger ml-2">(Limite de caracteres atingido)</span>}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isSystemAvailable}
                    className="btn btn-primary px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
                    title={
                      !isSystemAvailable && operatingInfo
                        ? `Sistema disponível apenas das ${operatingInfo.opensAt} às ${operatingInfo.closesAt}`
                        : ""
                    }
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Enviando...
                      </span>
                    ) : !isSystemAvailable ? (
                      <span className="flex items-center gap-2">
                        Sistema indisponível
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Concluir redação
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

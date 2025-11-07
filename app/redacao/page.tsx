"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getOperatingHoursInfo, type OperatingHoursInfo } from "@/lib/schedule";
import { supabase } from "@/lib/supabase";

const guidanceSteps = [
  "Leia o tema e destaque o problema central.",
  "Defina tese e dois argumentos antes de escrever.",
  "Use repertórios curtos e conectivos claros.",
  "Feche com proposta completa e viável.",
];

const MIN_CHARACTERS = 50;
const MAX_CHARACTERS = 2500;
const DEFAULT_THEME_TITLE = "Os desafios da educação digital no Brasil contemporâneo";
const MIN_CHAR_MESSAGE = `Sua redação precisa ter pelo menos ${MIN_CHARACTERS} caracteres antes do envio.`;
const MAX_CHAR_MESSAGE = `Sua redação ultrapassou o limite de ${MAX_CHARACTERS} caracteres.`;
const INVALID_THEME_MESSAGE = "Informe um tema personalizado válido (mínimo 5 caracteres).";
const INVALID_GENERATED_THEME_MESSAGE = "Não recebemos um tema válido da IA. Tente gerar novamente.";

const safeJsonParse = (input: string) => {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return null;
  }
};

const normalizeText = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed || fallback;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const errorMessage = record.error;
    const message = record.message;

    if (typeof errorMessage === "string" && errorMessage.trim()) {
      return errorMessage;
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export default function RedacaoPage() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
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
  const [isSupportCollapsed, setIsSupportCollapsed] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  const handleInput = () => {
    if (!editorRef.current) return;

    const normalized = normalizeText(editorRef.current.innerText);
    setContent(normalized);
    setValidationMessage((previous) => {
      if (normalized.length > MAX_CHARACTERS) {
        return MAX_CHAR_MESSAGE;
      }

      if (previous === MAX_CHAR_MESSAGE) {
        return null;
      }

      if (normalized.trim().length >= MIN_CHARACTERS && previous === MIN_CHAR_MESSAGE) {
        return null;
      }

      return previous;
    });
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const plainText = event.clipboardData.getData("text/plain");
    if (!plainText) return;

    const normalized = normalizeText(plainText);
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(normalized);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (editorRef.current) {
      const updatedContent = normalizeText(editorRef.current.innerText);
      setContent(updatedContent);
      setValidationMessage((previous) => {
        if (updatedContent.length > MAX_CHARACTERS) {
          return MAX_CHAR_MESSAGE;
        }

        if (previous === MAX_CHAR_MESSAGE) {
          return null;
        }

        if (updatedContent.trim().length >= MIN_CHARACTERS && previous === MIN_CHAR_MESSAGE) {
          return null;
        }

        return previous;
      });
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

  const handleFocusToggle = () => {
    setIsFocusMode((previous) => !previous);
  };

  useEffect(() => {
    if (!isFocusMode || !editorRef.current) return;

    const element = editorRef.current;
    element.focus();

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isFocusMode]);

  useEffect(() => {
    setIsSupportCollapsed(isFocusMode);
  }, [isFocusMode]);

  const handleSubmit = async () => {
    const info = operatingInfo ?? (await fetchOperatingInfo());
    applyOperatingInfo(info);

    if (!info?.isOpen) {
      setValidationMessage(null);
      setError(
        info
          ? `Sistema fora do horário de funcionamento. Disponível das ${info.opensAt} às ${info.closesAt}.`
          : "Não foi possível confirmar o horário de funcionamento. Tente novamente em instantes."
      );
      return;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < MIN_CHARACTERS) {
      setValidationMessage(MIN_CHAR_MESSAGE);
      return;
    }

    if (content.length > MAX_CHARACTERS) {
      setValidationMessage(MAX_CHAR_MESSAGE);
      return;
    }

    if (themeMode === "personalizado" && customTheme.trim().length < 5) {
      setValidationMessage(INVALID_THEME_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setValidationMessage(null);

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
      const responseText = await response.text();
      const isJsonResponse = response.headers.get("content-type")?.includes("application/json") ?? false;
      const parsedPayload = isJsonResponse ? safeJsonParse(responseText) : null;

      if (!response.ok) {
        throw new Error(getErrorMessage(parsedPayload ?? responseText, "Erro ao enviar redação."));
      }

      if (!parsedPayload || typeof parsedPayload !== "object") {
        throw new Error("Resposta inesperada do servidor. Tente novamente.");
      }

      const dataRecord = parsedPayload as Record<string, unknown>;
      const essayId = dataRecord.id;

      if (typeof essayId !== "string" || !essayId) {
        throw new Error("Resposta do servidor não contém o identificador da redação.");
      }

      localStorage.setItem("lastEssayId", essayId);
      router.push(`/resultados/${essayId}`);
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
      setValidationMessage(null);
      setError(
        info
          ? `Sistema fora do horário de funcionamento. Disponível das ${info.opensAt} às ${info.closesAt}.`
          : "Não foi possível confirmar o horário de funcionamento. Tente novamente em instantes."
      );
      return;
    }

    setValidationMessage(null);

    try {
      setIsGeneratingTheme(true);
      setError(null);

      const response = await fetch("/api/gerar-tema");
      const responseText = await response.text();
      const isJsonResponse = response.headers.get("content-type")?.includes("application/json") ?? false;
      const parsedPayload = isJsonResponse ? safeJsonParse(responseText) : null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(parsedPayload ?? responseText, "Não foi possível gerar um tema. Tente novamente.")
        );
      }

      if (!parsedPayload || typeof parsedPayload !== "object") {
        throw new Error("Resposta inesperada da IA. Por favor, tente novamente.");
      }

      const dataRecord = parsedPayload as Record<string, unknown>;
      const tema = typeof dataRecord.tema === "string" ? dataRecord.tema.trim() : "";

      if (!tema) {
        setValidationMessage(INVALID_GENERATED_THEME_MESSAGE);
        return;
      }

      setGeneratedTheme(tema);
      setGeneratedText1(typeof dataRecord.textoApoio1 === "string" ? dataRecord.textoApoio1 : "");
      setGeneratedText2(typeof dataRecord.textoApoio2 === "string" ? dataRecord.textoApoio2 : "");
      setValidationMessage(null);
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
        <div className="space-y-5">
          <div className="surface-card space-y-3 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-foreground">
              Tema personalizado
              <input
                type="text"
                value={customTheme}
                onChange={(event) => {
                  setCustomTheme(event.target.value);
                  setValidationMessage((previous) => (previous === INVALID_THEME_MESSAGE ? null : previous));
                }}
                placeholder="Digite o tema da redação..."
                className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <p className="text-xs text-foreground/60">
              Defina um tema claro, preferencialmente com recorte de problema e contexto social para facilitar sua tese.
            </p>
          </div>
          <div className="surface-card space-y-3 p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Textos de apoio (opcional)</p>
            <p className="text-xs text-foreground/60">
              Use estes campos para guardar repertórios, dados ou citações que deseja inserir ao longo da redação.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
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
        : DEFAULT_THEME_TITLE;
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
      <div className="space-y-5">
        <div className="surface-card space-y-3 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                {themeMode === "gerado" ? "Tema gerado automaticamente" : "Tema padrão"}
              </p>
              <p className="mt-3 text-xl font-semibold leading-relaxed text-foreground">&ldquo;{themeTitle}&rdquo;</p>
            </div>
            {themeMode === "gerado" && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">IA</span>
            )}
          </div>
          <p className="text-sm text-foreground/70">
            Use o tema como bússola: destaque o problema central, organize argumentos e pense na intervenção enquanto escreve.
          </p>
        </div>
        <div className="surface-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground/90">Textos de apoio</p>
              <p className="text-xs text-foreground/60">Abra quando precisar relembrar dados ou repertórios.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSupportCollapsed((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-full border border-border-color/60 px-3 py-1.5 text-xs font-semibold text-foreground/70 transition hover:border-primary hover:text-primary"
            >
              {isSupportCollapsed ? (
                <>
                  Mostrar textos
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </>
              ) : (
                <>
                  Ocultar textos
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />
                  </svg>
                </>
              )}
            </button>
          </div>
          {!isSupportCollapsed ? (
            <div className="mt-4 space-y-3">
              {supportTexts.map((support) => (
                <div
                  key={support.title}
                  className="rounded-2xl border border-border-color/60 bg-card-bg/70 p-4 text-sm leading-relaxed text-foreground/75 shadow-inner"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{support.title}</p>
                  <p className="mt-2">{support.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground/60">Os textos estão ocultos para manter o foco.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-grow transition-colors duration-300">
        <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto max-w-6xl space-y-10">
            <div className="rounded-3xl border border-border-color/40 bg-card-bg/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Simulado de redação
                  </span>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Um ambiente calmo para escrever sua redação.
                    </h1>
                    <p className="max-w-2xl text-base text-foreground/70">
                      Escolha ou gere um tema, estruture seus argumentos e escreva sem distrações. Ao enviar, você recebe a correção
                      completa com base nos critérios oficiais do ENEM.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 md:items-end">
                  <button
                    type="button"
                    onClick={handleFocusToggle}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isFocusMode
                        ? "bg-primary text-white shadow-md hover:bg-primary/90"
                        : "border border-border-color/70 bg-card-bg/80 text-foreground shadow-sm hover:border-primary hover:text-primary"
                    }`}
                  >
                    {isFocusMode ? (
                      <>
                        Sair do modo foco
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 19l-7-7 7-7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Ativar modo foco
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6v12m6-6H6" />
                        </svg>
                      </>
                    )}
                  </button>
                  {operatingInfo ? (
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        isSystemAvailable ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isSystemAvailable ? "bg-success" : "bg-warning"}`} />
                      {isSystemAvailable
                        ? "Correções disponíveis agora"
                        : `Correções das ${operatingInfo.opensAt} às ${operatingInfo.closesAt}`}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-card-bg/70 px-3 py-1 text-xs font-semibold text-foreground/60">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary/60" />
                      Checando disponibilidade...
                    </div>
                  )}
                </div>
              </div>
              {!isFocusMode && (
                <p className="mt-6 text-sm text-foreground/60">
                  Dica rápida: reserve alguns minutos para rascunhar a tese e os argumentos antes de mergulhar na escrita definitiva.
                </p>
              )}
            </div>

            <div className={`grid gap-8 ${isFocusMode ? "" : "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"}`}>
              <div className="space-y-6">
                <div className="surface-card space-y-6 p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Escolha o tema</h2>
                      <p className="text-sm text-foreground/70">Use o tema padrão, defina um próprio ou gere uma proposta com IA.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateTheme}
                      disabled={isGeneratingTheme}
                      className="inline-flex items-center gap-2 rounded-full border border-border-color/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingTheme ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
                        onChange={() => {
                          setThemeMode("padrao");
                          setValidationMessage((previous) =>
                            previous === INVALID_THEME_MESSAGE || previous === INVALID_GENERATED_THEME_MESSAGE ? null : previous
                          );
                        }}
                      />
                      <span>Tema padrão</span>
                    </label>
                    <label className={`radio-pill ${themeMode === "personalizado" ? "radio-pill--active" : ""}`}>
                      <input
                        type="radio"
                        name="tema"
                        value="personalizado"
                        checked={themeMode === "personalizado"}
                        onChange={() => {
                          setThemeMode("personalizado");
                          setValidationMessage((previous) =>
                            previous === INVALID_GENERATED_THEME_MESSAGE ? null : previous
                          );
                        }}
                      />
                      <span>Definir tema personalizado</span>
                    </label>
                    <label className={`radio-pill ${themeMode === "gerado" ? "radio-pill--active" : ""}`}>
                      <input
                        type="radio"
                        name="tema"
                        value="gerado"
                        checked={themeMode === "gerado"}
                        onChange={() => {
                          setThemeMode("gerado");
                          setValidationMessage((previous) =>
                            previous === INVALID_THEME_MESSAGE ? null : previous
                          );
                        }}
                      />
                      <span>Usar tema gerado automaticamente</span>
                    </label>
                  </div>

                  {renderThemeContent()}
                </div>

                <div className="surface-card space-y-5 p-6 shadow-2xl md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-foreground">Sua redação</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-foreground/60 sm:text-sm">
                      <span>
                        {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
                      </span>
                      <span className="hidden h-4 w-px bg-foreground/20 sm:block" aria-hidden />
                      <span>Mín. {MIN_CHARACTERS} · Máx. {MAX_CHARACTERS}</span>
                    </div>
                  </div>
                  <div
                    ref={editorRef}
                    className="editor-container"
                    contentEditable
                    tabIndex={0}
                    onInput={handleInput}
                    onPaste={handlePaste}
                    data-placeholder="Organize seus argumentos, conecte as ideias e finalize com uma intervenção transformadora."
                    aria-label="Editor de redação"
                  ></div>
                  <div
                    className={`char-counter flex flex-wrap items-center justify-end gap-4 text-xs text-foreground/60 sm:text-sm ${
                      content.length > MAX_CHARACTERS ? "text-danger" : ""
                    }`}
                  >
                    <span>{content.length}/{MAX_CHARACTERS} caracteres</span>
                    <span>~{Math.ceil(content.length / 80)} linhas</span>
                  </div>
                  {validationMessage && (
                    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-dark">
                      <p className="font-semibold">Revise antes de enviar:</p>
                      <p className="mt-1">{validationMessage}</p>
                    </div>
                  )}
                  {error && (
                    <div className="rounded-2xl border border-danger/20 bg-danger-light/30 p-4 text-sm text-danger">
                      <p className="font-semibold">Não conseguimos prosseguir:</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                    {!isSystemAvailable && operatingInfo && (
                      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                        Disponível das {operatingInfo.opensAt} às {operatingInfo.closesAt}
                      </span>
                    )}
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
                          Enviar para correção
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {!isFocusMode && (
                <aside className="space-y-6">
                  <div className="surface-card space-y-4 p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Dicas rápidas</h3>
                      <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">Modo minimal</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {guidanceSteps.map((step, index) => (
                        <span
                          key={step}
                          className="rounded-full border border-border-color/70 px-3 py-1 text-xs text-foreground/70"
                        >
                          {String(index + 1).padStart(2, "0")}. {step}
                        </span>
                      ))}
                    </div>
                    <details className="rounded-2xl border border-border-color/60 bg-card-bg/70 p-4 text-sm text-foreground/75">
                      <summary className="cursor-pointer font-semibold text-foreground">Ver checklist completo</summary>
                      <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                        <li>
                          <strong className="text-foreground">Planeje (10 min)</strong> · rascunhe tese, argumentos e repertórios.
                        </li>
                        <li>
                          <strong className="text-foreground">Redija (30 min)</strong> · desenvolva parágrafos com dados confiáveis.
                        </li>
                        <li>
                          <strong className="text-foreground">Revise (10 min)</strong> · ajuste conectivos, ortografia e intervenção.
                        </li>
                      </ul>
                    </details>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}

export interface EssaySubmission {
  redacao: string;
  usarTemaPadrao?: boolean;
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
}

export interface EssayResult {
  id: string;
  nota: number;
  competencia1: {
    nota: number;
    comentario: string;
  };
  competencia2: {
    nota: number;
    comentario: string;
  };
  competencia3: {
    nota: number;
    comentario: string;
  };
  competencia4: {
    nota: number;
    comentario: string;
  };
  competencia5: {
    nota: number;
    comentario: string;
  };
  feedbackGeral: string;
  pontoFortes: string[];
  pontosAMelhorar: string[];
  redacaoOriginal: string;
  createdAt: string;
  origem: "IA" | "Simulação"; // Adicionado campo para origem da correção
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
}

export interface EssayResultResponse {
  id: string;
  result?: EssayResult;
}

export interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagem_url: string;
  autor: string;
  data_publicacao: string;
  tags: string[];
  destaque: boolean;
  created_at: string;
}

// Novas interfaces para questões de múltipla escolha
export interface MultipleChoiceQuestion {
  id: string;
  disciplina: "Matemática" | "Português" | "Química" | "Física" | "Geografia";
  enunciado: string;
  alternativas: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  respostaCorreta: "a" | "b" | "c" | "d";
  explicacao?: string;
}

export interface QuizSubmission {
  respostas: {
    [questionId: string]: "a" | "b" | "c" | "d";
  };
}

export interface QuizResult {
  id: string;
  questoes: MultipleChoiceQuestion[];
  respostas: {
    [questionId: string]: "a" | "b" | "c" | "d";
  };
  acertos: number;
  pontuacao: number;
  createdAt: string;
}

export interface QuizResultResponse {
  id: string;
  result?: QuizResult;
}

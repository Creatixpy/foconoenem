export interface EssaySubmission {
  redacao: string;
  usarTemaPadrao?: boolean;
  themeMode?: 'generated' | 'manual';
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
  imagem_url: string | null;
  autor: string | null;
  data_publicacao: string;
  tags: string[];
  destaque: boolean;
  created_at: string;
  fonte_url?: string | null;
}

// Interfaces para questões de múltipla escolha
export interface Alternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  discipline: 'Matemática' | 'Português' | 'Química' | 'Física' | 'Geografia';
  text: string;
  explanation: string;
  alternatives: Alternative[];
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  score: number;
  questionResults: {
    questionId: string;
    isCorrect: boolean;
    selectedAlternativeId?: string;
    correctAlternativeId: string;
  }[];
}

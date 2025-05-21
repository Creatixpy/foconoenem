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

// Interfaces para questões de múltipla escolha
export interface MultipleChoiceQuestion {
  id: string;
  subject: 'matematica' | 'portugues' | 'quimica' | 'fisica' | 'geografia';
  question: string;
  options: string[];
  correctAnswer: number; // Índice da opção correta (0 a 4)
  explanation: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number; // Percentual de acertos
  answeredQuestions: {
    question: MultipleChoiceQuestion;
    userAnswer: number;
    isCorrect: boolean;
  }[];
}

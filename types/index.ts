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

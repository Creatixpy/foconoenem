-- Tabela para armazenar resultados de simulados de questões
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  unanswered_questions INTEGER NOT NULL,
  score INTEGER NOT NULL,
  disciplines TEXT[] NOT NULL,
  questions_data JSONB NOT NULL,
  answers_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON quiz_results(score DESC);

-- Comentários
COMMENT ON TABLE quiz_results IS 'Armazena resultados dos simulados de questões objetivas';
COMMENT ON COLUMN quiz_results.questions_data IS 'Dados completos das questões em JSON';
COMMENT ON COLUMN quiz_results.answers_data IS 'Respostas do usuário em JSON';;

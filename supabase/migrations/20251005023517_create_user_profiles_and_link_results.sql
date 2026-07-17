-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  avatar_url TEXT,
  bio TEXT,
  objetivo TEXT, -- Objetivo do usuário (ex: "Passar em Medicina na USP")
  ano_enem INTEGER, -- Ano que vai fazer o ENEM
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Adicionar coluna user_id nas tabelas de resultados
ALTER TABLE essay_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_results_user_id ON essay_results(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_results_user_created ON essay_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_created ON quiz_results(user_id, created_at DESC);

-- Criar tabela de metas/objetivos do usuário
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('redacao_nota_minima', 'questoes_acerto_minimo', 'estudar_disciplina', 'praticar_competencia')),
  descricao TEXT NOT NULL,
  valor_alvo INTEGER, -- Ex: nota 900, 80% de acertos
  disciplina TEXT, -- Para metas específicas de disciplina
  competencia INTEGER, -- Para metas de competência da redação (1-5)
  prazo DATE,
  concluida BOOLEAN DEFAULT FALSE,
  progresso INTEGER DEFAULT 0, -- Percentual de conclusão
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_concluida ON user_goals(user_id, concluida);

-- Criar tabela de estatísticas agregadas (cache de métricas)
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Estatísticas de redação
  total_redacoes INTEGER DEFAULT 0,
  media_nota_redacao DECIMAL(5,2),
  melhor_nota_redacao INTEGER,
  pior_nota_redacao INTEGER,
  media_competencia1 DECIMAL(5,2),
  media_competencia2 DECIMAL(5,2),
  media_competencia3 DECIMAL(5,2),
  media_competencia4 DECIMAL(5,2),
  media_competencia5 DECIMAL(5,2),
  
  -- Estatísticas de questões
  total_simulados INTEGER DEFAULT 0,
  total_questoes_respondidas INTEGER DEFAULT 0,
  total_acertos INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  taxa_acerto DECIMAL(5,2),
  
  -- Por disciplina
  acertos_matematica INTEGER DEFAULT 0,
  total_matematica INTEGER DEFAULT 0,
  acertos_portugues INTEGER DEFAULT 0,
  total_portugues INTEGER DEFAULT 0,
  acertos_quimica INTEGER DEFAULT 0,
  total_quimica INTEGER DEFAULT 0,
  acertos_fisica INTEGER DEFAULT 0,
  total_fisica INTEGER DEFAULT 0,
  acertos_geografia INTEGER DEFAULT 0,
  total_geografia INTEGER DEFAULT 0,
  
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas de segurança para user_goals
CREATE POLICY "Usuários podem ver suas próprias metas"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias metas"
  ON user_goals FOR ALL
  USING (auth.uid() = user_id);

-- Políticas de segurança para user_statistics
CREATE POLICY "Usuários podem ver suas próprias estatísticas"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias estatísticas"
  ON user_statistics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias estatísticas"
  ON user_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para essay_results (permitir sem autenticação, mas vincular se autenticado)
ALTER TABLE essay_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode inserir resultados de redação"
  ON essay_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem ver resultados públicos e seus próprios"
  ON essay_results FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Políticas para quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode inserir resultados de quiz"
  ON quiz_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem ver resultados públicos e seus próprios"
  ON quiz_results FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

COMMENT ON TABLE user_profiles IS 'Perfis dos usuários com informações pessoais e objetivos';
COMMENT ON TABLE user_goals IS 'Metas e objetivos de estudo dos usuários';
COMMENT ON TABLE user_statistics IS 'Estatísticas agregadas de desempenho dos usuários (cache)';
COMMENT ON COLUMN essay_results.user_id IS 'ID do usuário (null para não autenticados)';
COMMENT ON COLUMN quiz_results.user_id IS 'ID do usuário (null para não autenticados)';;

-- Habilitar RLS nas tabelas públicas que estavam sem proteção

-- 1. Tabela analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção de eventos (para tracking)
DROP POLICY IF EXISTS "Permitir inserção de eventos de analytics" ON analytics_events;
CREATE POLICY "Permitir inserção de eventos de analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Política: Apenas admins podem ler eventos (service_role apenas)
DROP POLICY IF EXISTS "Apenas service role pode ler analytics" ON analytics_events;
CREATE POLICY "Apenas service role pode ler analytics"
  ON analytics_events FOR SELECT
  USING (false); -- Acesso apenas via service_role key

-- 2. Tabela cached_themes
ALTER TABLE cached_themes ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura de temas em cache
DROP POLICY IF EXISTS "Qualquer um pode ler temas em cache" ON cached_themes;
CREATE POLICY "Qualquer um pode ler temas em cache"
  ON cached_themes FOR SELECT
  USING (true);

-- Política: Apenas sistema pode inserir (via service_role)
DROP POLICY IF EXISTS "Apenas sistema pode inserir temas" ON cached_themes;
CREATE POLICY "Apenas sistema pode inserir temas"
  ON cached_themes FOR INSERT
  WITH CHECK (false); -- Apenas via service_role

-- Política: Apenas sistema pode atualizar (para contador de uso)
DROP POLICY IF EXISTS "Apenas sistema pode atualizar temas" ON cached_themes;
CREATE POLICY "Apenas sistema pode atualizar temas"
  ON cached_themes FOR UPDATE
  USING (false); -- Apenas via service_role

-- 3. Tabela rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Política: Apenas sistema pode gerenciar rate limits
DROP POLICY IF EXISTS "Apenas sistema pode gerenciar rate limits" ON rate_limits;
CREATE POLICY "Apenas sistema pode gerenciar rate limits"
  ON rate_limits FOR ALL
  USING (false); -- Apenas via service_role

-- 4. Tabela configuracoes
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler configurações públicas
DROP POLICY IF EXISTS "Qualquer um pode ler configurações" ON configuracoes;
CREATE POLICY "Qualquer um pode ler configurações"
  ON configuracoes FOR SELECT
  USING (true);

-- Política: Apenas sistema pode modificar configurações
DROP POLICY IF EXISTS "Apenas sistema pode modificar configurações" ON configuracoes;
CREATE POLICY "Apenas sistema pode modificar configurações"
  ON configuracoes FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Apenas sistema pode atualizar configurações" ON configuracoes;
CREATE POLICY "Apenas sistema pode atualizar configurações"
  ON configuracoes FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Apenas sistema pode deletar configurações" ON configuracoes;
CREATE POLICY "Apenas sistema pode deletar configurações"
  ON configuracoes FOR DELETE
  USING (false);

-- 5. Tabela noticias
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler notícias
DROP POLICY IF EXISTS "Qualquer um pode ler notícias" ON noticias;
CREATE POLICY "Qualquer um pode ler notícias"
  ON noticias FOR SELECT
  USING (true);

-- Política: Apenas admins autenticados podem inserir notícias
-- Você pode ajustar isso depois para permitir apenas usuários específicos
DROP POLICY IF EXISTS "Admins podem inserir notícias" ON noticias;
CREATE POLICY "Admins podem inserir notícias"
  ON noticias FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    -- Adicione aqui uma verificação de role de admin se tiver
  );

-- Política: Apenas admins podem atualizar notícias
DROP POLICY IF EXISTS "Admins podem atualizar notícias" ON noticias;
CREATE POLICY "Admins podem atualizar notícias"
  ON noticias FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    -- Adicione aqui uma verificação de role de admin se tiver
  );

-- Política: Apenas admins podem deletar notícias
DROP POLICY IF EXISTS "Admins podem deletar notícias" ON noticias;
CREATE POLICY "Admins podem deletar notícias"
  ON noticias FOR DELETE
  USING (
    auth.role() = 'authenticated'
    -- Adicione aqui uma verificação de role de admin se tiver
  );

-- Comentários explicativos
COMMENT ON POLICY "Permitir inserção de eventos de analytics" ON analytics_events IS 
  'Permite que a aplicação registre eventos de analytics sem autenticação';

COMMENT ON POLICY "Qualquer um pode ler temas em cache" ON cached_themes IS 
  'Permite que usuários não autenticados vejam temas em cache para melhor UX';

COMMENT ON POLICY "Qualquer um pode ler notícias" ON noticias IS 
  'Notícias são públicas e podem ser lidas por todos';

COMMENT ON POLICY "Admins podem inserir notícias" ON noticias IS 
  'Apenas usuários autenticados (admins) podem criar notícias';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'RLS habilitado com sucesso em todas as tabelas públicas';
  RAISE NOTICE 'Políticas de segurança aplicadas:';
  RAISE NOTICE '- analytics_events: Inserção pública, leitura via service_role';
  RAISE NOTICE '- cached_themes: Leitura pública, modificação via service_role';
  RAISE NOTICE '- rate_limits: Gerenciamento apenas via service_role';
  RAISE NOTICE '- configuracoes: Leitura pública, modificação via service_role';
  RAISE NOTICE '- noticias: Leitura pública, modificação apenas por autenticados';
END $$;;

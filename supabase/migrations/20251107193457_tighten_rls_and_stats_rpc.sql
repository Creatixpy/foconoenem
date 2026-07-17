begin;

DROP POLICY IF EXISTS "Allow public rate limit access" ON public.rate_limits;

DROP POLICY IF EXISTS "Qualquer um pode inserir resultados de redação" ON public.essay_results;
DROP POLICY IF EXISTS "Visitantes podem inserir redações públicas" ON public.essay_results;
CREATE POLICY "Usuários autenticados inserem suas redações"
  ON public.essay_results
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Visitantes podem inserir redações públicas"
  ON public.essay_results
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

DROP POLICY IF EXISTS "Qualquer um pode inserir resultados de quiz" ON public.quiz_results;
DROP POLICY IF EXISTS "Visitantes podem inserir quizzes públicos" ON public.quiz_results;
CREATE POLICY "Usuários autenticados inserem seus quizzes"
  ON public.quiz_results
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Visitantes podem inserir quizzes públicos"
  ON public.quiz_results
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

ALTER TABLE public.noticias
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(resumo, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(conteudo, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_noticias_search_vector
  ON public.noticias
  USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_noticias_tags_gin
  ON public.noticias
  USING gin (tags);

CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(target_user_id uuid)
RETURNS public.user_statistics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_role text := auth.role();
  requester_id uuid := auth.uid();
  v_total_redacoes int := 0;
  v_media_nota numeric;
  v_melhor_nota int;
  v_pior_nota int;
  v_media_c1 numeric;
  v_media_c2 numeric;
  v_media_c3 numeric;
  v_media_c4 numeric;
  v_media_c5 numeric;
  v_total_simulados int := 0;
  v_total_questoes int := 0;
  v_total_acertos int := 0;
  v_total_erros int := 0;
  v_taxa_acerto numeric;
  v_acertos_matematica int := 0;
  v_total_matematica int := 0;
  v_acertos_portugues int := 0;
  v_total_portugues int := 0;
  v_acertos_quimica int := 0;
  v_total_quimica int := 0;
  v_acertos_fisica int := 0;
  v_total_fisica int := 0;
  v_acertos_geografia int := 0;
  v_total_geografia int := 0;
  v_result public.user_statistics;
BEGIN
  IF requester_role IS DISTINCT FROM 'service_role' AND requester_id IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Você só pode atualizar suas próprias estatísticas.' USING ERRCODE = '42501';
  END IF;

  SELECT
    count(*)::int,
    avg(nota)::numeric,
    max(nota)::int,
    min(nota)::int,
    avg((competencia1->>'nota')::numeric),
    avg((competencia2->>'nota')::numeric),
    avg((competencia3->>'nota')::numeric),
    avg((competencia4->>'nota')::numeric),
    avg((competencia5->>'nota')::numeric)
  INTO
    v_total_redacoes,
    v_media_nota,
    v_melhor_nota,
    v_pior_nota,
    v_media_c1,
    v_media_c2,
    v_media_c3,
    v_media_c4,
    v_media_c5
  FROM public.essay_results
  WHERE user_id = target_user_id;

  SELECT
    count(*)::int,
    coalesce(sum(total_questions), 0),
    coalesce(sum(correct_answers), 0),
    coalesce(sum(wrong_answers), 0)
  INTO
    v_total_simulados,
    v_total_questoes,
    v_total_acertos,
    v_total_erros
  FROM public.quiz_results
  WHERE user_id = target_user_id;

  IF v_total_questoes > 0 THEN
    v_taxa_acerto := (v_total_acertos::numeric / v_total_questoes::numeric) * 100;
  ELSE
    v_taxa_acerto := NULL;
  END IF;

  WITH expanded AS (
    SELECT
      (question->>'discipline') AS discipline,
      (SELECT alt->>'id'
         FROM jsonb_array_elements(question->'alternatives') AS alt
        WHERE (alt->>'isCorrect')::boolean
        LIMIT 1) AS correct_id,
      (qr.answers_data ->> (question->>'id')) AS user_answer
    FROM public.quiz_results qr
    CROSS JOIN LATERAL jsonb_array_elements(qr.questions_data) AS question
    WHERE qr.user_id = target_user_id
  ), stats AS (
    SELECT
      sum(CASE WHEN discipline = 'Matemática' AND user_answer = correct_id THEN 1 ELSE 0 END)::int AS acertos_matematica,
      sum(CASE WHEN discipline = 'Matemática' THEN 1 ELSE 0 END)::int AS total_matematica,
      sum(CASE WHEN discipline = 'Português' AND user_answer = correct_id THEN 1 ELSE 0 END)::int AS acertos_portugues,
      sum(CASE WHEN discipline = 'Português' THEN 1 ELSE 0 END)::int AS total_portugues,
      sum(CASE WHEN discipline = 'Química' AND user_answer = correct_id THEN 1 ELSE 0 END)::int AS acertos_quimica,
      sum(CASE WHEN discipline = 'Química' THEN 1 ELSE 0 END)::int AS total_quimica,
      sum(CASE WHEN discipline = 'Física' AND user_answer = correct_id THEN 1 ELSE 0 END)::int AS acertos_fisica,
      sum(CASE WHEN discipline = 'Física' THEN 1 ELSE 0 END)::int AS total_fisica,
      sum(CASE WHEN discipline = 'Geografia' AND user_answer = correct_id THEN 1 ELSE 0 END)::int AS acertos_geografia,
      sum(CASE WHEN discipline = 'Geografia' THEN 1 ELSE 0 END)::int AS total_geografia
    FROM expanded
  )
  SELECT
    coalesce(acertos_matematica, 0),
    coalesce(total_matematica, 0),
    coalesce(acertos_portugues, 0),
    coalesce(total_portugues, 0),
    coalesce(acertos_quimica, 0),
    coalesce(total_quimica, 0),
    coalesce(acertos_fisica, 0),
    coalesce(total_fisica, 0),
    coalesce(acertos_geografia, 0),
    coalesce(total_geografia, 0)
  INTO
    v_acertos_matematica,
    v_total_matematica,
    v_acertos_portugues,
    v_total_portugues,
    v_acertos_quimica,
    v_total_quimica,
    v_acertos_fisica,
    v_total_fisica,
    v_acertos_geografia,
    v_total_geografia
  FROM stats;

  INSERT INTO public.user_statistics AS us (
    user_id,
    total_redacoes,
    media_nota_redacao,
    melhor_nota_redacao,
    pior_nota_redacao,
    media_competencia1,
    media_competencia2,
    media_competencia3,
    media_competencia4,
    media_competencia5,
    total_simulados,
    total_questoes_respondidas,
    total_acertos,
    total_erros,
    taxa_acerto,
    acertos_matematica,
    total_matematica,
    acertos_portugues,
    total_portugues,
    acertos_quimica,
    total_quimica,
    acertos_fisica,
    total_fisica,
    acertos_geografia,
    total_geografia,
    ultima_atualizacao
  )
  VALUES (
    target_user_id,
    coalesce(v_total_redacoes, 0),
    v_media_nota,
    v_melhor_nota,
    v_pior_nota,
    v_media_c1,
    v_media_c2,
    v_media_c3,
    v_media_c4,
    v_media_c5,
    v_total_simulados,
    v_total_questoes,
    v_total_acertos,
    v_total_erros,
    v_taxa_acerto,
    v_acertos_matematica,
    v_total_matematica,
    v_acertos_portugues,
    v_total_portugues,
    v_acertos_quimica,
    v_total_quimica,
    v_acertos_fisica,
    v_total_fisica,
    v_acertos_geografia,
    v_total_geografia,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_redacoes = EXCLUDED.total_redacoes,
    media_nota_redacao = EXCLUDED.media_nota_redacao,
    melhor_nota_redacao = EXCLUDED.melhor_nota_redacao,
    pior_nota_redacao = EXCLUDED.pior_nota_redacao,
    media_competencia1 = EXCLUDED.media_competencia1,
    media_competencia2 = EXCLUDED.media_competencia2,
    media_competencia3 = EXCLUDED.media_competencia3,
    media_competencia4 = EXCLUDED.media_competencia4,
    media_competencia5 = EXCLUDED.media_competencia5,
    total_simulados = EXCLUDED.total_simulados,
    total_questoes_respondidas = EXCLUDED.total_questoes_respondidas,
    total_acertos = EXCLUDED.total_acertos,
    total_erros = EXCLUDED.total_erros,
    taxa_acerto = EXCLUDED.taxa_acerto,
    acertos_matematica = EXCLUDED.acertos_matematica,
    total_matematica = EXCLUDED.total_matematica,
    acertos_portugues = EXCLUDED.acertos_portugues,
    total_portugues = EXCLUDED.total_portugues,
    acertos_quimica = EXCLUDED.acertos_quimica,
    total_quimica = EXCLUDED.total_quimica,
    acertos_fisica = EXCLUDED.acertos_fisica,
    total_fisica = EXCLUDED.total_fisica,
    acertos_geografia = EXCLUDED.acertos_geografia,
    total_geografia = EXCLUDED.total_geografia,
    ultima_atualizacao = EXCLUDED.ultima_atualizacao
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO service_role;

commit;;

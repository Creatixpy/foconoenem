
CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(target_user_id uuid)
RETURNS public.user_statistics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_role text := auth.role();
  requester_id uuid := auth.uid();
  v_result public.user_statistics;
BEGIN
  IF requester_role IS DISTINCT FROM 'service_role' AND requester_id IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Você só pode atualizar suas próprias estatísticas.' USING errcode = '42501';
  END IF;

  WITH essay_stats AS (
    SELECT
      count(*)::int AS total,
      avg(nota)::numeric AS media_nota,
      max(nota)::int AS melhor,
      min(nota)::int AS pior,
      avg((competencia1->>'nota')::numeric) AS media_c1,
      avg((competencia2->>'nota')::numeric) AS media_c2,
      avg((competencia3->>'nota')::numeric) AS media_c3,
      avg((competencia4->>'nota')::numeric) AS media_c4,
      avg((competencia5->>'nota')::numeric) AS media_c5
    FROM public.essay_results
    WHERE user_id = target_user_id
  ),
  quiz_totals AS (
    SELECT
      count(*)::int AS total_simulados,
      coalesce(sum(total_questions), 0) AS total_questoes,
      coalesce(sum(correct_answers), 0) AS total_acertos,
      coalesce(sum(wrong_answers), 0) AS total_erros
    FROM public.quiz_results
    WHERE user_id = target_user_id
  ),
  quiz_disciplines AS (
    SELECT
      sum(CASE WHEN discipline = 'Matemática' AND is_correct THEN 1 ELSE 0 END)::int AS acertos_matematica,
      sum(CASE WHEN discipline = 'Matemática' THEN 1 ELSE 0 END)::int AS total_matematica,
      sum(CASE WHEN discipline = 'Português' AND is_correct THEN 1 ELSE 0 END)::int AS acertos_portugues,
      sum(CASE WHEN discipline = 'Português' THEN 1 ELSE 0 END)::int AS total_portugues,
      sum(CASE WHEN discipline = 'Química' AND is_correct THEN 1 ELSE 0 END)::int AS acertos_quimica,
      sum(CASE WHEN discipline = 'Química' THEN 1 ELSE 0 END)::int AS total_quimica,
      sum(CASE WHEN discipline = 'Física' AND is_correct THEN 1 ELSE 0 END)::int AS acertos_fisica,
      sum(CASE WHEN discipline = 'Física' THEN 1 ELSE 0 END)::int AS total_fisica,
      sum(CASE WHEN discipline = 'Geografia' AND is_correct THEN 1 ELSE 0 END)::int AS acertos_geografia,
      sum(CASE WHEN discipline = 'Geografia' THEN 1 ELSE 0 END)::int AS total_geografia
    FROM (
      SELECT
        (question->>'discipline') AS discipline,
        COALESCE(
          -- New format: answers_data is an array of {question_id, selected_alternative_id, is_correct}
          (SELECT (ans->>'is_correct')::boolean
           FROM jsonb_array_elements(qr.answers_data) AS ans
           WHERE ans->>'question_id' = question->>'id'
           LIMIT 1),
          -- Fallback: answers_data is a flat object {question_id: selected_alternative_id}
          (qr.answers_data ->> (question->>'id')) =
            (SELECT alt->>'id'
             FROM jsonb_array_elements(question->'alternatives') AS alt
             WHERE (alt->>'isCorrect')::boolean
             LIMIT 1)
        ) AS is_correct
      FROM public.quiz_results qr
      CROSS JOIN LATERAL jsonb_array_elements(qr.questions_data) AS question
      WHERE qr.user_id = target_user_id
    ) expanded
  )
  INSERT INTO public.user_statistics AS us (
    user_id, total_redacoes, media_nota_redacao, melhor_nota_redacao, pior_nota_redacao,
    media_competencia1, media_competencia2, media_competencia3, media_competencia4, media_competencia5,
    total_simulados, total_questoes_respondidas, total_acertos, total_erros, taxa_acerto,
    acertos_matematica, total_matematica, acertos_portugues, total_portugues,
    acertos_quimica, total_quimica, acertos_fisica, total_fisica,
    acertos_geografia, total_geografia, ultima_atualizacao
  )
  SELECT
    target_user_id, coalesce(es.total, 0), es.media_nota, es.melhor, es.pior,
    es.media_c1, es.media_c2, es.media_c3, es.media_c4, es.media_c5,
    qt.total_simulados, qt.total_questoes, qt.total_acertos, qt.total_erros,
    CASE WHEN qt.total_questoes > 0 THEN (qt.total_acertos::numeric / qt.total_questoes::numeric) * 100 ELSE NULL END,
    coalesce(qd.acertos_matematica, 0), coalesce(qd.total_matematica, 0),
    coalesce(qd.acertos_portugues, 0), coalesce(qd.total_portugues, 0),
    coalesce(qd.acertos_quimica, 0), coalesce(qd.total_quimica, 0),
    coalesce(qd.acertos_fisica, 0), coalesce(qd.total_fisica, 0),
    coalesce(qd.acertos_geografia, 0), coalesce(qd.total_geografia, 0), now()
  FROM essay_stats es CROSS JOIN quiz_totals qt CROSS JOIN quiz_disciplines qd
  ON CONFLICT (user_id) DO UPDATE SET
    total_redacoes = excluded.total_redacoes, media_nota_redacao = excluded.media_nota_redacao,
    melhor_nota_redacao = excluded.melhor_nota_redacao, pior_nota_redacao = excluded.pior_nota_redacao,
    media_competencia1 = excluded.media_competencia1, media_competencia2 = excluded.media_competencia2,
    media_competencia3 = excluded.media_competencia3, media_competencia4 = excluded.media_competencia4,
    media_competencia5 = excluded.media_competencia5, total_simulados = excluded.total_simulados,
    total_questoes_respondidas = excluded.total_questoes_respondidas, total_acertos = excluded.total_acertos,
    total_erros = excluded.total_erros, taxa_acerto = excluded.taxa_acerto,
    acertos_matematica = excluded.acertos_matematica, total_matematica = excluded.total_matematica,
    acertos_portugues = excluded.acertos_portugues, total_portugues = excluded.total_portugues,
    acertos_quimica = excluded.acertos_quimica, total_quimica = excluded.total_quimica,
    acertos_fisica = excluded.acertos_fisica, total_fisica = excluded.total_fisica,
    acertos_geografia = excluded.acertos_geografia, total_geografia = excluded.total_geografia,
    ultima_atualizacao = excluded.ultima_atualizacao
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
;

CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(target_user_id uuid)
 RETURNS public.user_statistics
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  requester_role text := auth.role();
  requester_id uuid := auth.uid();
  v_result public.user_statistics;
begin
  -- Check permission
  if requester_role is distinct from 'service_role' and requester_id is distinct from target_user_id then
    raise exception 'Você só pode atualizar suas próprias estatísticas.' using errcode = '42501';
  end if;

  with essay_stats as (
    select
      count(*)::int as total,
      avg(nota)::numeric as media_nota,
      max(nota)::int as melhor,
      min(nota)::int as pior,
      avg((competencia1->>'nota')::numeric) as media_c1,
      avg((competencia2->>'nota')::numeric) as media_c2,
      avg((competencia3->>'nota')::numeric) as media_c3,
      avg((competencia4->>'nota')::numeric) as media_c4,
      avg((competencia5->>'nota')::numeric) as media_c5
    from public.essay_results
    where user_id = target_user_id
  ),
  quiz_totals as (
    select
      count(*)::int as total_simulados,
      coalesce(sum(total_questions), 0) as total_questoes,
      coalesce(sum(correct_answers), 0) as total_acertos,
      coalesce(sum(total_questions - correct_answers), 0) as total_erros
    from public.quiz_attempts
    where user_id = target_user_id
  ),
  quiz_disciplines as (
    select
      sum(case when gq.discipline = 'Matemática' and qa.is_correct then 1 else 0 end)::int as acertos_matematica,
      sum(case when gq.discipline = 'Matemática' then 1 else 0 end)::int as total_matematica,
      sum(case when gq.discipline = 'Português' and qa.is_correct then 1 else 0 end)::int as acertos_portugues,
      sum(case when gq.discipline = 'Português' then 1 else 0 end)::int as total_portugues,
      sum(case when gq.discipline = 'Química' and qa.is_correct then 1 else 0 end)::int as acertos_quimica,
      sum(case when gq.discipline = 'Química' then 1 else 0 end)::int as total_quimica,
      sum(case when gq.discipline = 'Física' and qa.is_correct then 1 else 0 end)::int as acertos_fisica,
      sum(case when gq.discipline = 'Física' then 1 else 0 end)::int as total_fisica,
      sum(case when gq.discipline = 'Geografia' and qa.is_correct then 1 else 0 end)::int as acertos_geografia,
      sum(case when gq.discipline = 'Geografia' then 1 else 0 end)::int as total_geografia
    from public.quiz_answers qa
    join public.generated_questions gq on qa.question_id = gq.id
    join public.quiz_attempts qt on qa.attempt_id = qt.id
    where qt.user_id = target_user_id
  )
  insert into public.user_statistics as us (
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
  select
    target_user_id,
    coalesce(es.total, 0),
    es.media_nota,
    es.melhor,
    es.pior,
    es.media_c1,
    es.media_c2,
    es.media_c3,
    es.media_c4,
    es.media_c5,
    qt.total_simulados,
    qt.total_questoes,
    qt.total_acertos,
    qt.total_erros,
    case when qt.total_questoes > 0
      then (qt.total_acertos::numeric / qt.total_questoes::numeric) * 100
      else null
    end,
    coalesce(qd.acertos_matematica, 0),
    coalesce(qd.total_matematica, 0),
    coalesce(qd.acertos_portugues, 0),
    coalesce(qd.total_portugues, 0),
    coalesce(qd.acertos_quimica, 0),
    coalesce(qd.total_quimica, 0),
    coalesce(qd.acertos_fisica, 0),
    coalesce(qd.total_fisica, 0),
    coalesce(qd.acertos_geografia, 0),
    coalesce(qd.total_geografia, 0),
    now()
  from essay_stats es
  cross join quiz_totals qt
  cross join quiz_disciplines qd
  on conflict (user_id) do update set
    total_redacoes = excluded.total_redacoes,
    media_nota_redacao = excluded.media_nota_redacao,
    melhor_nota_redacao = excluded.melhor_nota_redacao,
    pior_nota_redacao = excluded.pior_nota_redacao,
    media_competencia1 = excluded.media_competencia1,
    media_competencia2 = excluded.media_competencia2,
    media_competencia3 = excluded.media_competencia3,
    media_competencia4 = excluded.media_competencia4,
    media_competencia5 = excluded.media_competencia5,
    total_simulados = excluded.total_simulados,
    total_questoes_respondidas = excluded.total_questoes_respondidas,
    total_acertos = excluded.total_acertos,
    total_erros = excluded.total_erros,
    taxa_acerto = excluded.taxa_acerto,
    acertos_matematica = excluded.acertos_matematica,
    total_matematica = excluded.total_matematica,
    acertos_portugues = excluded.acertos_portugues,
    total_portugues = excluded.total_portugues,
    acertos_quimica = excluded.acertos_quimica,
    total_quimica = excluded.total_quimica,
    acertos_fisica = excluded.acertos_fisica,
    total_fisica = excluded.total_fisica,
    acertos_geografia = excluded.acertos_geografia,
    total_geografia = excluded.total_geografia,
    ultima_atualizacao = excluded.ultima_atualizacao
  returning * into v_result;

  return v_result;
end;
$function$;;

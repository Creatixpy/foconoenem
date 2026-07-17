-- Strengthen the database/application boundary without touching Auth users.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Restore canonical questions that only existed inside historical quiz snapshots.
with candidates as (
  select distinct on (question ->> 'id')
    (question ->> 'id')::uuid as id,
    btrim(question ->> 'text') as content,
    question ->> 'discipline' as discipline,
    coalesce(nullif(btrim(question ->> 'explanation'), ''), 'Sem explicação disponível.') as explanation,
    question -> 'alternatives' as alternatives,
    null::text as topic,
    'desafiador'::text as difficulty
  from public.quiz_results qr
  cross join lateral jsonb_array_elements(qr.questions_data) as question
  left join public.generated_questions g
    on g.id::text = question ->> 'id'
  where g.id is null
    and (question ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and nullif(btrim(question ->> 'text'), '') is not null
    and question ->> 'discipline' = any (
      array['Matemática', 'Português', 'Química', 'Física', 'Geografia']
    )
    and jsonb_typeof(question -> 'alternatives') = 'array'
    and jsonb_array_length(question -> 'alternatives') = 4
    and (
      select count(*)
      from jsonb_array_elements(question -> 'alternatives') as alternative
      where coalesce((alternative ->> 'isCorrect')::boolean, false)
    ) = 1
  order by question ->> 'id', qr.created_at desc
)
insert into public.generated_questions (
  id,
  content,
  discipline,
  explanation,
  alternatives,
  topic,
  difficulty
)
select id, content, discipline, explanation, alternatives, topic, difficulty
from candidates
on conflict (id) do nothing;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disciplines text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  consumed_at timestamptz,
  quiz_result_id uuid references public.quiz_results(id) on delete set null,
  constraint quiz_attempts_expiry_check check (expires_at > created_at),
  constraint quiz_attempts_consumption_check check (
    (consumed_at is null and quiz_result_id is null)
    or (consumed_at is not null and quiz_result_id is not null)
  )
);

create table if not exists public.quiz_attempt_questions (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.generated_questions(id) on delete restrict,
  position smallint not null,
  primary key (attempt_id, question_id),
  unique (attempt_id, position),
  constraint quiz_attempt_questions_position_check check (position >= 0)
);

create index if not exists idx_quiz_attempts_user_created
  on public.quiz_attempts (user_id, created_at desc);
create index if not exists idx_quiz_attempts_cleanup
  on public.quiz_attempts (expires_at, consumed_at);

alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_questions enable row level security;

revoke all on public.quiz_attempts from public, anon, authenticated;
revoke all on public.quiz_attempt_questions from public, anon, authenticated;
grant select, insert, update, delete on public.quiz_attempts to service_role;
grant select, insert, update, delete on public.quiz_attempt_questions to service_role;

create or replace function private.recalculate_user_statistics(target_user_id uuid)
returns public.user_statistics
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_row public.user_statistics;
begin
  if target_user_id is null then
    return null;
  end if;

  with essay_stats as (
    select
      count(*)::int as total,
      avg(nota)::numeric as media_nota,
      max(nota)::int as melhor,
      min(nota)::int as pior,
      avg((competencia1 ->> 'nota')::numeric) as media_c1,
      avg((competencia2 ->> 'nota')::numeric) as media_c2,
      avg((competencia3 ->> 'nota')::numeric) as media_c3,
      avg((competencia4 ->> 'nota')::numeric) as media_c4,
      avg((competencia5 ->> 'nota')::numeric) as media_c5
    from public.essay_results
    where user_id = target_user_id
  ),
  quiz_totals as (
    select
      count(*)::int as total_simulados,
      coalesce(sum(correct_answers + wrong_answers), 0)::int as total_respondidas,
      coalesce(sum(correct_answers), 0)::int as total_acertos,
      coalesce(sum(wrong_answers), 0)::int as total_erros
    from public.quiz_results
    where user_id = target_user_id
  ),
  expanded_answers as (
    select
      question ->> 'discipline' as discipline,
      nullif(btrim(matched.candidate ->> 'selected_alternative_id'), '') as selected_alternative_id,
      coalesce((matched.candidate ->> 'is_correct')::boolean, false) as is_correct
    from public.quiz_results qr
    cross join lateral jsonb_array_elements(qr.questions_data) as question
    left join lateral (
      select candidate
      from jsonb_array_elements(qr.answers_data) as candidate
      where candidate ->> 'question_id' = question ->> 'id'
      limit 1
    ) matched on true
    where qr.user_id = target_user_id
  ),
  quiz_disciplines as (
    select
      count(*) filter (
        where discipline = 'Matemática'
          and selected_alternative_id is not null
          and is_correct
      )::int as acertos_matematica,
      count(*) filter (
        where discipline = 'Matemática' and selected_alternative_id is not null
      )::int as total_matematica,
      count(*) filter (
        where discipline = 'Português'
          and selected_alternative_id is not null
          and is_correct
      )::int as acertos_portugues,
      count(*) filter (
        where discipline = 'Português' and selected_alternative_id is not null
      )::int as total_portugues,
      count(*) filter (
        where discipline = 'Química'
          and selected_alternative_id is not null
          and is_correct
      )::int as acertos_quimica,
      count(*) filter (
        where discipline = 'Química' and selected_alternative_id is not null
      )::int as total_quimica,
      count(*) filter (
        where discipline = 'Física'
          and selected_alternative_id is not null
          and is_correct
      )::int as acertos_fisica,
      count(*) filter (
        where discipline = 'Física' and selected_alternative_id is not null
      )::int as total_fisica,
      count(*) filter (
        where discipline = 'Geografia'
          and selected_alternative_id is not null
          and is_correct
      )::int as acertos_geografia,
      count(*) filter (
        where discipline = 'Geografia' and selected_alternative_id is not null
      )::int as total_geografia
    from expanded_answers
  )
  insert into public.user_statistics as statistics (
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
    qt.total_respondidas,
    qt.total_acertos,
    qt.total_erros,
    case
      when qt.total_respondidas > 0
        then (qt.total_acertos::numeric / qt.total_respondidas::numeric) * 100
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
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function private.recalculate_user_statistics(uuid) from public, anon, authenticated;

create or replace function public.recalculate_user_statistics(target_user_id uuid)
returns public.user_statistics
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role'
    and auth.uid() is distinct from target_user_id then
    raise exception 'Você só pode atualizar suas próprias estatísticas.'
      using errcode = '42501';
  end if;

  return private.recalculate_user_statistics(target_user_id);
end;
$$;

create or replace function private.sync_user_statistics_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    perform private.recalculate_user_statistics(old.user_id);
  end if;

  if tg_op = 'DELETE' then
    perform private.recalculate_user_statistics(old.user_id);
    return old;
  end if;

  perform private.recalculate_user_statistics(new.user_id);
  return new;
end;
$$;

drop trigger if exists sync_essay_user_statistics on public.essay_results;
create trigger sync_essay_user_statistics
after insert or update or delete on public.essay_results
for each row execute function private.sync_user_statistics_trigger();

drop trigger if exists sync_quiz_user_statistics on public.quiz_results;
create trigger sync_quiz_user_statistics
after insert or update or delete on public.quiz_results
for each row execute function private.sync_user_statistics_trigger();

create or replace function public.create_quiz_attempt(
  p_user_id uuid,
  p_question_ids uuid[],
  p_ttl_minutes integer default 1440
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_row public.quiz_attempts;
  question_count integer;
  distinct_count integer;
  found_count integer;
  selected_disciplines text[];
begin
  question_count := coalesce(cardinality(p_question_ids), 0);
  if question_count < 1 or question_count > 15 then
    raise exception 'invalid_question_count' using errcode = '22023';
  end if;

  if p_ttl_minutes < 5 or p_ttl_minutes > 1440 then
    raise exception 'invalid_quiz_ttl' using errcode = '22023';
  end if;

  select count(distinct question_id), count(g.id), array_agg(distinct g.discipline order by g.discipline)
  into distinct_count, found_count, selected_disciplines
  from unnest(p_question_ids) as question_id
  left join public.generated_questions g on g.id = question_id;

  if distinct_count <> question_count then
    raise exception 'duplicate_question_ids' using errcode = '22023';
  end if;

  if found_count <> question_count then
    raise exception 'unknown_question_id' using errcode = '22023';
  end if;

  insert into public.quiz_attempts (user_id, disciplines, expires_at)
  values (
    p_user_id,
    coalesce(selected_disciplines, '{}'::text[]),
    now() + make_interval(mins => p_ttl_minutes)
  )
  returning * into result_row;

  insert into public.quiz_attempt_questions (attempt_id, question_id, position)
  select result_row.id, question_id, (ordinality - 1)::smallint
  from unnest(p_question_ids) with ordinality as selected(question_id, ordinality);

  return result_row;
end;
$$;

create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_user_id uuid,
  p_selected_answers jsonb
)
returns public.quiz_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_row public.quiz_attempts;
  result_row public.quiz_results;
  questions_snapshot jsonb;
  answers_snapshot jsonb;
  total_count integer;
  correct_count integer;
  unanswered_count integer;
  wrong_count integer;
  calculated_score integer;
begin
  if jsonb_typeof(p_selected_answers) is distinct from 'object' then
    raise exception 'invalid_answer_map' using errcode = '22023';
  end if;

  select *
  into attempt_row
  from public.quiz_attempts
  where id = p_attempt_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'quiz_attempt_not_found' using errcode = 'P0002';
  end if;

  if attempt_row.consumed_at is not null and attempt_row.quiz_result_id is not null then
    select *
    into result_row
    from public.quiz_results
    where id = attempt_row.quiz_result_id
      and user_id = p_user_id;

    if found then
      return result_row;
    end if;
  end if;

  if attempt_row.expires_at <= now() then
    raise exception 'quiz_attempt_expired' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_selected_answers) as submitted(question_id)
    where not exists (
      select 1
      from public.quiz_attempt_questions aq
      where aq.attempt_id = p_attempt_id
        and aq.question_id::text = submitted.question_id
    )
  ) then
    raise exception 'answer_for_unknown_question' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.quiz_attempt_questions aq
    join public.generated_questions g on g.id = aq.question_id
    cross join lateral (
      select nullif(btrim(p_selected_answers ->> g.id::text), '') as selected_id
    ) submitted
    where aq.attempt_id = p_attempt_id
      and submitted.selected_id is not null
      and not exists (
        select 1
        from jsonb_array_elements(g.alternatives) alternative
        where alternative ->> 'id' = submitted.selected_id
      )
  ) then
    raise exception 'invalid_selected_answer' using errcode = '22023';
  end if;

  with evaluated as (
    select
      aq.position,
      g.id,
      g.discipline,
      g.content,
      coalesce(g.explanation, 'Sem explicação disponível.') as explanation,
      g.alternatives,
      nullif(btrim(p_selected_answers ->> g.id::text), '') as selected_id,
      coalesce((
        select (alternative ->> 'isCorrect')::boolean
        from jsonb_array_elements(g.alternatives) alternative
        where alternative ->> 'id' = nullif(btrim(p_selected_answers ->> g.id::text), '')
        limit 1
      ), false) as is_correct
    from public.quiz_attempt_questions aq
    join public.generated_questions g on g.id = aq.question_id
    where aq.attempt_id = p_attempt_id
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'discipline', discipline,
        'text', content,
        'explanation', explanation,
        'alternatives', alternatives
      )
      order by position
    ),
    jsonb_agg(
      jsonb_build_object(
        'question_id', id,
        'selected_alternative_id', selected_id,
        'is_correct', is_correct
      )
      order by position
    ),
    count(*)::int,
    count(*) filter (where selected_id is not null and is_correct)::int,
    count(*) filter (where selected_id is null)::int
  into
    questions_snapshot,
    answers_snapshot,
    total_count,
    correct_count,
    unanswered_count
  from evaluated;

  if total_count < 1 then
    raise exception 'quiz_attempt_has_no_questions' using errcode = '22023';
  end if;

  wrong_count := total_count - correct_count - unanswered_count;
  calculated_score := round((correct_count::numeric / total_count::numeric) * 100)::int;

  insert into public.quiz_results (
    user_id,
    total_questions,
    correct_answers,
    wrong_answers,
    unanswered_questions,
    score,
    disciplines,
    questions_data,
    answers_data
  )
  values (
    p_user_id,
    total_count,
    correct_count,
    wrong_count,
    unanswered_count,
    calculated_score,
    attempt_row.disciplines,
    questions_snapshot,
    answers_snapshot
  )
  returning * into result_row;

  update public.quiz_attempts
  set consumed_at = now(),
      quiz_result_id = result_row.id
  where id = p_attempt_id;

  return result_row;
end;
$$;

create or replace function public.consume_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff timestamptz;
  oldest_request timestamptz;
  used_requests integer;
begin
  if nullif(btrim(p_identifier), '') is null
    or nullif(btrim(p_endpoint), '') is null
    or p_max_requests < 1
    or p_window_minutes < 1 then
    raise exception 'invalid_rate_limit_parameters' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_identifier || chr(31) || p_endpoint, 0)
  );

  cutoff := now() - make_interval(mins => p_window_minutes);

  delete from public.rate_limits
  where identifier = p_identifier
    and endpoint = p_endpoint
    and window_start < cutoff;

  select coalesce(sum(request_count), 0)::int, min(window_start)
  into used_requests, oldest_request
  from public.rate_limits
  where identifier = p_identifier
    and endpoint = p_endpoint
    and window_start >= cutoff;

  if used_requests >= p_max_requests then
    return query select
      false,
      0,
      coalesce(oldest_request, now()) + make_interval(mins => p_window_minutes);
    return;
  end if;

  insert into public.rate_limits (identifier, endpoint, request_count, window_start)
  values (p_identifier, p_endpoint, 1, now());

  return query select
    true,
    greatest(p_max_requests - used_requests - 1, 0),
    coalesce(oldest_request, now()) + make_interval(mins => p_window_minutes);
end;
$$;

create or replace function public.increment_cached_theme_usage(p_theme_id uuid)
returns public.cached_themes
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_row public.cached_themes;
begin
  update public.cached_themes
  set usado_count = usado_count + 1
  where id = p_theme_id
  returning * into result_row;

  if not found then
    raise exception 'cached_theme_not_found' using errcode = 'P0002';
  end if;

  return result_row;
end;
$$;

create or replace function public.replace_news_highlights(p_ids uuid[])
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(p_ids), 0);
  approved_count integer;
begin
  if requested_count < 1 or requested_count > 5 then
    raise exception 'invalid_highlight_count' using errcode = '22023';
  end if;

  if (select count(distinct id) from unnest(p_ids) as id) <> requested_count then
    raise exception 'duplicate_highlight_ids' using errcode = '22023';
  end if;

  select count(*)
  into approved_count
  from public.noticias
  where id = any(p_ids)
    and status = 'aprovado';

  if approved_count <> requested_count then
    raise exception 'invalid_highlight_ids' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('news-highlights', 0));

  update public.noticias
  set destaque = false
  where destaque;

  update public.noticias
  set destaque = true
  where id = any(p_ids);

  insert into public.configuracoes (chave, valor)
  values ('ultima_atualizacao_destaques', now()::text)
  on conflict (chave) do update set valor = excluded.valor;

  return p_ids;
end;
$$;

create or replace function public.run_maintenance_task(p_task text)
returns table (
  ran boolean,
  deleted integer,
  ran_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  config_key text := 'maintenance:' || p_task || ':last_run_at';
  previous_run timestamptz;
  minimum_interval interval;
  deleted_rows integer := 0;
  current_run timestamptz := now();
begin
  minimum_interval := case p_task
    when 'rate_limits' then interval '15 minutes'
    when 'analytics_events' then interval '6 hours'
    when 'cached_themes' then interval '12 hours'
    when 'quiz_attempts' then interval '12 hours'
    else null
  end;

  if minimum_interval is null then
    raise exception 'unknown_maintenance_task' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(config_key, 0));

  select case
    when valor ~ '^\\d{4}-\\d{2}-\\d{2}T' then valor::timestamptz
    else null
  end
  into previous_run
  from public.configuracoes
  where chave = config_key;

  if previous_run is not null and current_run - previous_run < minimum_interval then
    return query select false, 0, previous_run;
    return;
  end if;

  if p_task = 'rate_limits' then
    delete from public.rate_limits
    where window_start < current_run - interval '1 hour';
  elsif p_task = 'analytics_events' then
    delete from public.analytics_events
    where created_at < current_run - interval '90 days';
  elsif p_task = 'cached_themes' then
    delete from public.cached_themes
    where created_at < current_run - interval '7 days';
  else
    delete from public.quiz_attempts
    where (consumed_at is null and expires_at < current_run - interval '1 day')
       or (consumed_at is not null and consumed_at < current_run - interval '7 days');
  end if;

  get diagnostics deleted_rows = row_count;

  insert into public.configuracoes (chave, valor)
  values (config_key, current_run::text)
  on conflict (chave) do update set valor = excluded.valor;

  return query select true, deleted_rows, current_run;
end;
$$;

create or replace function public.claim_subscription_event(p_event jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id text := nullif(p_event ->> 'stripe_event_id', '');
  claimed_status text;
  existing_status text;
begin
  if event_id is null or jsonb_typeof(p_event -> 'payload') is null then
    raise exception 'invalid_subscription_event' using errcode = '22023';
  end if;

  insert into public.subscription_events (
    stripe_event_id,
    event_type,
    livemode,
    api_version,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_checkout_session_id,
    user_id,
    event_created_at,
    status,
    payload,
    error_message,
    processed_at
  )
  values (
    event_id,
    p_event ->> 'event_type',
    coalesce((p_event ->> 'livemode')::boolean, false),
    nullif(p_event ->> 'api_version', ''),
    nullif(p_event ->> 'stripe_customer_id', ''),
    nullif(p_event ->> 'stripe_subscription_id', ''),
    nullif(p_event ->> 'stripe_checkout_session_id', ''),
    case
      when (p_event ->> 'user_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (p_event ->> 'user_id')::uuid
      else null
    end,
    (p_event ->> 'event_created_at')::timestamptz,
    'received',
    p_event -> 'payload',
    null,
    null
  )
  on conflict (stripe_event_id) do update set
    status = 'received',
    error_message = null,
    processed_at = null,
    payload = excluded.payload,
    updated_at = now()
  where subscription_events.status = 'failed'
     or (
       subscription_events.status = 'received'
       and subscription_events.updated_at < now() - interval '5 minutes'
     )
  returning status into claimed_status;

  if claimed_status is not null then
    return 'claimed';
  end if;

  select status into existing_status
  from public.subscription_events
  where stripe_event_id = event_id;

  if existing_status in ('processed', 'ignored') then
    return 'duplicate';
  end if;

  return 'in_progress';
end;
$$;

create or replace function public.claim_donation_event(p_event jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id text := nullif(p_event ->> 'stripe_event_id', '');
  claimed_status text;
  existing_status text;
begin
  if event_id is null or jsonb_typeof(p_event -> 'payload') is null then
    raise exception 'invalid_donation_event' using errcode = '22023';
  end if;

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    livemode,
    api_version,
    checkout_session_id,
    client_reference_id,
    event_created_at,
    status,
    payload,
    error_message,
    processed_at
  )
  values (
    event_id,
    p_event ->> 'event_type',
    coalesce((p_event ->> 'livemode')::boolean, false),
    nullif(p_event ->> 'api_version', ''),
    nullif(p_event ->> 'checkout_session_id', ''),
    case
      when (p_event ->> 'client_reference_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (p_event ->> 'client_reference_id')::uuid
      else null
    end,
    (p_event ->> 'event_created_at')::timestamptz,
    'received',
    p_event -> 'payload',
    null,
    null
  )
  on conflict (stripe_event_id) do update set
    status = 'received',
    error_message = null,
    processed_at = null,
    payload = excluded.payload,
    updated_at = now()
  where stripe_webhook_events.status = 'failed'
     or (
       stripe_webhook_events.status = 'received'
       and stripe_webhook_events.updated_at < now() - interval '5 minutes'
     )
  returning status into claimed_status;

  if claimed_status is not null then
    return 'claimed';
  end if;

  select status into existing_status
  from public.stripe_webhook_events
  where stripe_event_id = event_id;

  if existing_status in ('processed', 'ignored') then
    return 'duplicate';
  end if;

  return 'in_progress';
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.recalculate_user_statistics(uuid) from public, anon, authenticated;
revoke all on function public.create_quiz_attempt(uuid, uuid[], integer) from public, anon, authenticated;
revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.increment_cached_theme_usage(uuid) from public, anon, authenticated;
revoke all on function public.replace_news_highlights(uuid[]) from public, anon, authenticated;
revoke all on function public.run_maintenance_task(text) from public, anon, authenticated;
revoke all on function public.claim_subscription_event(jsonb) from public, anon, authenticated;
revoke all on function public.claim_donation_event(jsonb) from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;

grant execute on function public.recalculate_user_statistics(uuid) to service_role;
grant execute on function public.create_quiz_attempt(uuid, uuid[], integer) to service_role;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb) to service_role;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.increment_cached_theme_usage(uuid) to service_role;
grant execute on function public.replace_news_highlights(uuid[]) to service_role;
grant execute on function public.run_maintenance_task(text) to service_role;
grant execute on function public.claim_subscription_event(jsonb) to service_role;
grant execute on function public.claim_donation_event(jsonb) to service_role;
grant execute on function public.update_updated_at_column() to service_role;

-- Remove only indexes proven redundant with current unique constraints or queries.
drop index if exists public.idx_user_profiles_user;
drop index if exists public.idx_user_statistics_user;
drop index if exists public.idx_user_profiles_created_at;

-- Apply the existing retention policy and normalize abandoned checkout state.
delete from public.analytics_events
where created_at < now() - interval '90 days';

delete from public.cached_themes
where created_at < now() - interval '7 days';

delete from public.rate_limits
where window_start < now() - interval '1 hour';

update public.subscriptions
set status = 'incomplete_expired',
    updated_at = now()
where status = 'checkout_pending'
  and latest_checkout_expires_at is not null
  and latest_checkout_expires_at < now();

insert into public.configuracoes (chave, valor)
values
  ('maintenance:analytics_events:last_run_at', now()::text),
  ('maintenance:cached_themes:last_run_at', now()::text),
  ('maintenance:rate_limits:last_run_at', now()::text),
  ('maintenance:quiz_attempts:last_run_at', now()::text)
on conflict (chave) do update set valor = excluded.valor;

-- Recompute current aggregates with the corrected answered-question semantics.
do $$
declare
  statistics_user_id uuid;
begin
  for statistics_user_id in
    select user_id from public.user_statistics
  loop
    perform private.recalculate_user_statistics(statistics_user_id);
  end loop;
end;
$$;

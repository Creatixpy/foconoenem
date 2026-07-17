-- Canonical, server-only essay/theme/quiz workflows.
-- Historical essay_results and quiz_results are intentionally preserved.

create schema if not exists private;

-- The reusable catalog was explicitly reset before enforcing the new contract.
delete from public.quiz_attempt_questions;
delete from public.quiz_attempts;
delete from public.generated_questions;
delete from public.cached_themes;

create or replace function private.normalize_catalog_text(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select lower(regexp_replace(btrim(p_value), '[[:space:]]+', ' ', 'g'));
$$;

create or replace function private.question_fingerprint(
  p_discipline text,
  p_content text,
  p_alternatives jsonb
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select md5(
    private.normalize_catalog_text(p_discipline) || '|' ||
    private.normalize_catalog_text(p_content) || '|' ||
    p_alternatives::text
  );
$$;

create or replace function private.valid_question_alternatives(p_alternatives jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select
    jsonb_typeof(p_alternatives) = 'array'
    and jsonb_array_length(p_alternatives) = 4
    and (
      select count(*) = 4
        and count(distinct btrim(alternative ->> 'id')) = 4
        and count(distinct private.normalize_catalog_text(alternative ->> 'text')) = 4
        and count(*) filter (
          where jsonb_typeof(alternative -> 'isCorrect') = 'boolean'
            and (alternative ->> 'isCorrect')::boolean
        ) = 1
        and bool_and(
          jsonb_typeof(alternative) = 'object'
          and nullif(btrim(alternative ->> 'id'), '') is not null
          and nullif(btrim(alternative ->> 'text'), '') is not null
          and jsonb_typeof(alternative -> 'isCorrect') = 'boolean'
        )
      from jsonb_array_elements(p_alternatives) alternative
    );
$$;

alter table public.generated_questions
  add column if not exists fingerprint text;

alter table public.generated_questions
  alter column explanation set not null,
  alter column created_at set not null;

alter table public.generated_questions
  drop constraint if exists generated_questions_discipline_check,
  add constraint generated_questions_discipline_check
    check (discipline = any (array['Matemática', 'Português', 'Química', 'Física', 'Geografia'])),
  drop constraint if exists generated_questions_content_check,
  add constraint generated_questions_content_check
    check (char_length(btrim(content)) between 20 and 8000),
  drop constraint if exists generated_questions_explanation_check,
  add constraint generated_questions_explanation_check
    check (char_length(btrim(explanation)) between 20 and 6000),
  drop constraint if exists generated_questions_alternatives_check,
  add constraint generated_questions_alternatives_check
    check (private.valid_question_alternatives(alternatives));

alter table public.generated_questions
  alter column fingerprint set not null;

drop index if exists public.generated_questions_fingerprint_key;
create unique index generated_questions_fingerprint_key
  on public.generated_questions (fingerprint);

alter table public.cached_themes
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists fingerprint text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.cached_themes
  alter column fingerprint set not null;

alter table public.cached_themes
  drop constraint if exists cached_themes_content_check,
  add constraint cached_themes_content_check check (
    char_length(btrim(tema)) between 10 and 300
    and char_length(btrim(texto_apoio1)) between 40 and 3000
    and char_length(btrim(texto_apoio2)) between 40 and 3000
  );

drop index if exists public.cached_themes_shared_fingerprint_key;
drop index if exists public.cached_themes_private_fingerprint_key;
create unique index cached_themes_shared_fingerprint_key
  on public.cached_themes (fingerprint)
  where owner_user_id is null;
create unique index cached_themes_private_fingerprint_key
  on public.cached_themes (owner_user_id, fingerprint)
  where owner_user_id is not null;
create index if not exists idx_cached_themes_owner_created
  on public.cached_themes (owner_user_id, created_at desc);

alter table public.quiz_attempts
  add column if not exists request_id uuid;

alter table public.quiz_attempts
  alter column request_id set not null;

drop index if exists public.quiz_attempts_user_request_key;
create unique index quiz_attempts_user_request_key
  on public.quiz_attempts (user_id, request_id);

create table if not exists public.essay_submissions (
  submission_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  input_fingerprint text not null,
  status text not null default 'processing'
    check (status = any (array['processing', 'completed', 'failed'])),
  result_id uuid references public.essay_results(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint essay_submissions_completion_check check (
    (status = 'completed' and result_id is not null)
    or (status <> 'completed' and result_id is null)
  )
);

create index if not exists idx_essay_submissions_user_created
  on public.essay_submissions (user_id, created_at desc);

create or replace function private.valid_essay_competence(p_competence jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select coalesce((
    jsonb_typeof(p_competence) = 'object'
    and (p_competence ->> 'nota') ~ '^(0|40|80|120|160|200)$'
    and char_length(btrim(coalesce(p_competence ->> 'comentario', ''))) between 20 and 2000
  ), false);
$$;

alter table public.essay_results
  drop constraint if exists essay_results_canonical_scores,
  add constraint essay_results_canonical_scores check (
    private.valid_essay_competence(competencia1)
    and private.valid_essay_competence(competencia2)
    and private.valid_essay_competence(competencia3)
    and private.valid_essay_competence(competencia4)
    and private.valid_essay_competence(competencia5)
    and nota =
      (competencia1 ->> 'nota')::integer +
      (competencia2 ->> 'nota')::integer +
      (competencia3 ->> 'nota')::integer +
      (competencia4 ->> 'nota')::integer +
      (competencia5 ->> 'nota')::integer
  ) not valid;

create or replace function public.upsert_generated_question(p_question jsonb)
returns public.generated_questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_row public.generated_questions;
  question_discipline text := nullif(btrim(p_question ->> 'discipline'), '');
  question_content text := nullif(btrim(p_question ->> 'text'), '');
  question_alternatives jsonb := p_question -> 'alternatives';
  question_explanation text := nullif(btrim(p_question ->> 'explanation'), '');
  question_fingerprint text;
begin
  if question_discipline is null or question_content is null
     or question_alternatives is null or question_explanation is null then
    raise exception 'invalid_generated_question' using errcode = '22023';
  end if;

  question_fingerprint := private.question_fingerprint(
    question_discipline,
    question_content,
    question_alternatives
  );

  insert into public.generated_questions (
    discipline,
    content,
    alternatives,
    explanation,
    topic,
    difficulty,
    fingerprint
  )
  values (
    question_discipline,
    question_content,
    question_alternatives,
    question_explanation,
    nullif(btrim(p_question ->> 'topic'), ''),
    nullif(btrim(p_question ->> 'difficulty'), ''),
    question_fingerprint
  )
  on conflict (fingerprint) do update set
    topic = coalesce(public.generated_questions.topic, excluded.topic),
    difficulty = coalesce(public.generated_questions.difficulty, excluded.difficulty)
  returning * into question_row;

  return question_row;
end;
$$;

create or replace function public.get_balanced_questions(
  p_disciplines text[],
  p_limit_per_discipline integer default 20
)
returns setof public.generated_questions
language sql
security definer
set search_path = ''
as $$
  with ranked as (
    select
      question.*,
      row_number() over (
        partition by question.discipline
        order by question.created_at desc, question.id
      ) as discipline_rank
    from public.generated_questions question
    where question.discipline = any (p_disciplines)
      and question.created_at >= now() - interval '30 days'
  )
  select
    id, discipline, content, alternatives, explanation,
    topic, difficulty, created_at, fingerprint
  from ranked
  where discipline_rank <= greatest(1, least(p_limit_per_discipline, 100));
$$;

create or replace function public.upsert_cached_theme(
  p_user_id uuid,
  p_private boolean,
  p_theme jsonb
)
returns public.cached_themes
language plpgsql
security definer
set search_path = ''
as $$
declare
  theme_owner uuid := case when p_private then p_user_id else null end;
  theme_title text := nullif(btrim(p_theme ->> 'tema'), '');
  support_one text := nullif(btrim(p_theme ->> 'textoApoio1'), '');
  support_two text := nullif(btrim(p_theme ->> 'textoApoio2'), '');
  theme_fingerprint text;
  theme_row public.cached_themes;
begin
  if p_private and p_user_id is null then
    raise exception 'private_theme_requires_user' using errcode = '22023';
  end if;
  if theme_title is null or support_one is null or support_two is null then
    raise exception 'invalid_cached_theme' using errcode = '22023';
  end if;

  theme_fingerprint := md5(private.normalize_catalog_text(theme_title));

  if p_private then
    insert into public.cached_themes (
      owner_user_id, tema, texto_apoio1, texto_apoio2, fingerprint
    )
    values (theme_owner, theme_title, support_one, support_two, theme_fingerprint)
    on conflict (owner_user_id, fingerprint) where owner_user_id is not null
    do update set
      texto_apoio1 = excluded.texto_apoio1,
      texto_apoio2 = excluded.texto_apoio2,
      updated_at = now()
    returning * into theme_row;
  else
    insert into public.cached_themes (
      owner_user_id, tema, texto_apoio1, texto_apoio2, fingerprint
    )
    values (null, theme_title, support_one, support_two, theme_fingerprint)
    on conflict (fingerprint) where owner_user_id is null
    do update set
      texto_apoio1 = excluded.texto_apoio1,
      texto_apoio2 = excluded.texto_apoio2,
      updated_at = now()
    returning * into theme_row;
  end if;

  return theme_row;
end;
$$;

create or replace function public.claim_cached_theme(p_user_id uuid)
returns public.cached_themes
language plpgsql
security definer
set search_path = ''
as $$
declare
  theme_row public.cached_themes;
begin
  select theme.*
  into theme_row
  from public.cached_themes theme
  where theme.owner_user_id is null
    and theme.created_at >= now() - interval '7 days'
    and not exists (
      select 1
      from public.essay_results result
      where result.user_id = p_user_id
        and result.created_at >= now() - interval '90 days'
        and private.normalize_catalog_text(coalesce(result.tema, '')) =
            private.normalize_catalog_text(theme.tema)
    )
  order by theme.usado_count asc, theme.created_at desc
  limit 1
  for update skip locked;

  if not found then
    return null;
  end if;

  update public.cached_themes
  set usado_count = usado_count + 1,
      updated_at = now()
  where id = theme_row.id
  returning * into theme_row;

  return theme_row;
end;
$$;

create or replace function public.get_cached_theme(
  p_theme_id uuid,
  p_user_id uuid
)
returns public.cached_themes
language sql
security definer
set search_path = ''
as $$
  select theme
  from public.cached_themes theme
  where theme.id = p_theme_id
    and (theme.owner_user_id is null or theme.owner_user_id = p_user_id)
    and theme.created_at >= now() - interval '7 days';
$$;

drop function if exists public.create_quiz_attempt(uuid, uuid[], integer);
drop function if exists public.increment_cached_theme_usage(uuid);

create or replace function public.create_quiz_attempt(
  p_user_id uuid,
  p_request_id uuid,
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
  existing_question_ids uuid[];
  question_count integer := coalesce(cardinality(p_question_ids), 0);
  found_count integer;
  selected_disciplines text[];
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'invalid_quiz_owner' using errcode = '22023';
  end if;
  if question_count < 1 or question_count > 15 then
    raise exception 'invalid_question_count' using errcode = '22023';
  end if;
  if p_ttl_minutes < 5 or p_ttl_minutes > 1440 then
    raise exception 'invalid_quiz_ttl' using errcode = '22023';
  end if;
  if (select count(distinct question_id) from unnest(p_question_ids) question_id) <> question_count then
    raise exception 'duplicate_question_ids' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_request_id::text, 0));

  select *
  into result_row
  from public.quiz_attempts
  where user_id = p_user_id and request_id = p_request_id
  for update;

  if found then
    select array_agg(question_id order by position)
    into existing_question_ids
    from public.quiz_attempt_questions
    where attempt_id = result_row.id;

    if existing_question_ids is distinct from p_question_ids then
      raise exception 'quiz_request_conflict' using errcode = '23505';
    end if;
    return result_row;
  end if;

  select count(g.id), array_agg(distinct g.discipline order by g.discipline)
  into found_count, selected_disciplines
  from unnest(p_question_ids) question_id
  left join public.generated_questions g on g.id = question_id;

  if found_count <> question_count then
    raise exception 'unknown_question_id' using errcode = '22023';
  end if;

  insert into public.quiz_attempts (user_id, request_id, disciplines, expires_at)
  values (
    p_user_id,
    p_request_id,
    coalesce(selected_disciplines, '{}'::text[]),
    now() + make_interval(mins => p_ttl_minutes)
  )
  returning * into result_row;

  insert into public.quiz_attempt_questions (attempt_id, question_id, position)
  select result_row.id, question_id, (ordinality - 1)::smallint
  from unnest(p_question_ids) with ordinality selected(question_id, ordinality);

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
    raise exception 'invalid_answer_map' using errcode = 'P0004';
  end if;

  select * into attempt_row
  from public.quiz_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'quiz_attempt_not_found' using errcode = 'P0002';
  end if;

  if attempt_row.consumed_at is not null and attempt_row.quiz_result_id is not null then
    select * into result_row
    from public.quiz_results
    where id = attempt_row.quiz_result_id and user_id = p_user_id;
    if found then return result_row; end if;
  end if;

  if attempt_row.expires_at <= now() then
    raise exception 'quiz_attempt_expired' using errcode = 'P0003';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_selected_answers) submitted(question_id)
    where not exists (
      select 1
      from public.quiz_attempt_questions attempt_question
      where attempt_question.attempt_id = p_attempt_id
        and attempt_question.question_id::text = submitted.question_id
    )
  ) then
    raise exception 'answer_for_unknown_question' using errcode = 'P0004';
  end if;

  if exists (
    select 1
    from public.quiz_attempt_questions attempt_question
    join public.generated_questions question on question.id = attempt_question.question_id
    cross join lateral (
      select nullif(btrim(p_selected_answers ->> question.id::text), '') selected_id
    ) submitted
    where attempt_question.attempt_id = p_attempt_id
      and submitted.selected_id is not null
      and not exists (
        select 1
        from jsonb_array_elements(question.alternatives) alternative
        where alternative ->> 'id' = submitted.selected_id
      )
  ) then
    raise exception 'invalid_selected_answer' using errcode = 'P0004';
  end if;

  with evaluated as (
    select
      attempt_question.position,
      question.id,
      question.discipline,
      question.content,
      question.explanation,
      question.alternatives,
      nullif(btrim(p_selected_answers ->> question.id::text), '') selected_id,
      coalesce((
        select (alternative ->> 'isCorrect')::boolean
        from jsonb_array_elements(question.alternatives) alternative
        where alternative ->> 'id' = nullif(btrim(p_selected_answers ->> question.id::text), '')
        limit 1
      ), false) is_correct
    from public.quiz_attempt_questions attempt_question
    join public.generated_questions question on question.id = attempt_question.question_id
    where attempt_question.attempt_id = p_attempt_id
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'discipline', discipline,
        'text', content,
        'explanation', explanation,
        'alternatives', alternatives
      ) order by position
    ),
    jsonb_agg(
      jsonb_build_object(
        'question_id', id,
        'selected_alternative_id', selected_id,
        'is_correct', is_correct
      ) order by position
    ),
    count(*)::integer,
    count(*) filter (where selected_id is not null and is_correct)::integer,
    count(*) filter (where selected_id is null)::integer
  into questions_snapshot, answers_snapshot, total_count, correct_count, unanswered_count
  from evaluated;

  if total_count < 1 then
    raise exception 'quiz_attempt_has_no_questions' using errcode = 'P0004';
  end if;

  wrong_count := total_count - correct_count - unanswered_count;
  calculated_score := round((correct_count::numeric / total_count::numeric) * 100)::integer;

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
  set consumed_at = now(), quiz_result_id = result_row.id
  where id = p_attempt_id;

  return result_row;
end;
$$;

create or replace function public.claim_essay_submission(
  p_submission_id uuid,
  p_user_id uuid,
  p_input_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission_row public.essay_submissions;
begin
  if p_submission_id is null or p_user_id is null or nullif(p_input_fingerprint, '') is null then
    raise exception 'invalid_essay_submission' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 0));

  select * into submission_row
  from public.essay_submissions
  where submission_id = p_submission_id
  for update;

  if not found then
    insert into public.essay_submissions (submission_id, user_id, input_fingerprint)
    values (p_submission_id, p_user_id, p_input_fingerprint);
    return jsonb_build_object('state', 'claimed');
  end if;

  if submission_row.user_id <> p_user_id
     or submission_row.input_fingerprint <> p_input_fingerprint then
    return jsonb_build_object('state', 'conflict');
  end if;

  if submission_row.status = 'completed' then
    return jsonb_build_object('state', 'completed', 'resultId', submission_row.result_id);
  end if;

  if submission_row.status = 'failed'
     or submission_row.updated_at < now() - interval '5 minutes' then
    update public.essay_submissions
    set status = 'processing', error_message = null, updated_at = now()
    where submission_id = p_submission_id;
    return jsonb_build_object('state', 'claimed');
  end if;

  return jsonb_build_object('state', 'in_progress');
end;
$$;

create or replace function public.complete_essay_submission(
  p_submission_id uuid,
  p_user_id uuid,
  p_input_fingerprint text,
  p_result jsonb
)
returns public.essay_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission_row public.essay_submissions;
  result_row public.essay_results;
begin
  select * into submission_row
  from public.essay_submissions
  where submission_id = p_submission_id
  for update;

  if not found or submission_row.user_id <> p_user_id
     or submission_row.input_fingerprint <> p_input_fingerprint then
    raise exception 'essay_submission_conflict' using errcode = '23505';
  end if;

  if submission_row.status = 'completed' and submission_row.result_id is not null then
    select * into result_row
    from public.essay_results
    where id = submission_row.result_id and user_id = p_user_id;
    return result_row;
  end if;

  if submission_row.status <> 'processing' then
    raise exception 'essay_submission_not_claimed' using errcode = '55000';
  end if;

  insert into public.essay_results (
    id, user_id, nota,
    competencia1, competencia2, competencia3, competencia4, competencia5,
    feedback_geral, ponto_fortes, pontos_a_melhorar,
    redacao_original, origem, tema, texto_apoio1, texto_apoio2
  )
  values (
    (p_result ->> 'id')::uuid,
    p_user_id,
    (p_result ->> 'nota')::smallint,
    p_result -> 'competencia1',
    p_result -> 'competencia2',
    p_result -> 'competencia3',
    p_result -> 'competencia4',
    p_result -> 'competencia5',
    p_result ->> 'feedbackGeral',
    array(select jsonb_array_elements_text(p_result -> 'pontoFortes')),
    array(select jsonb_array_elements_text(p_result -> 'pontosAMelhorar')),
    p_result ->> 'redacaoOriginal',
    'IA',
    nullif(p_result ->> 'tema', ''),
    nullif(p_result ->> 'textoApoio1', ''),
    nullif(p_result ->> 'textoApoio2', '')
  )
  returning * into result_row;

  update public.essay_submissions
  set status = 'completed', result_id = result_row.id, error_message = null, updated_at = now()
  where submission_id = p_submission_id;

  return result_row;
end;
$$;

create or replace function public.fail_essay_submission(
  p_submission_id uuid,
  p_user_id uuid,
  p_input_fingerprint text,
  p_error_message text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.essay_submissions
  set status = 'failed',
      error_message = left(coalesce(p_error_message, 'unknown_error'), 1000),
      updated_at = now()
  where submission_id = p_submission_id
    and user_id = p_user_id
    and input_fingerprint = p_input_fingerprint
    and status = 'processing';
$$;

create or replace function public.run_maintenance_task(p_task text)
returns table(ran boolean, deleted integer, ran_at timestamptz)
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
    when 'generated_questions' then interval '12 hours'
    when 'essay_submissions' then interval '12 hours'
    else null
  end;

  if minimum_interval is null then
    raise exception 'unknown_maintenance_task' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(config_key, 0));

  select case when valor ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' then valor::timestamptz else null end
  into previous_run
  from public.configuracoes
  where chave = config_key;

  if previous_run is not null and current_run - previous_run < minimum_interval then
    return query select false, 0, previous_run;
    return;
  end if;

  if p_task = 'rate_limits' then
    delete from public.rate_limits where window_start < current_run - interval '1 hour';
  elsif p_task = 'analytics_events' then
    delete from public.analytics_events where created_at < current_run - interval '90 days';
  elsif p_task = 'cached_themes' then
    delete from public.cached_themes where created_at < current_run - interval '7 days';
  elsif p_task = 'quiz_attempts' then
    delete from public.quiz_attempts
    where (consumed_at is null and expires_at < current_run - interval '1 day')
       or (consumed_at is not null and consumed_at < current_run - interval '7 days');
  elsif p_task = 'generated_questions' then
    delete from public.generated_questions question
    where question.created_at < current_run - interval '30 days'
      and not exists (
        select 1 from public.quiz_attempt_questions attempt_question
        where attempt_question.question_id = question.id
      );
  else
    delete from public.essay_submissions
    where updated_at < current_run - interval '7 days';
  end if;

  get diagnostics deleted_rows = row_count;

  insert into public.configuracoes (chave, valor)
  values (config_key, current_run::text)
  on conflict (chave) do update set valor = excluded.valor;

  return query select true, deleted_rows, current_run;
end;
$$;

-- Server-only table access. Historical rows remain readable through server pages.
drop policy if exists cached_themes_select on public.cached_themes;
drop policy if exists generated_questions_select on public.generated_questions;
drop policy if exists essay_results_insert on public.essay_results;
drop policy if exists essay_results_select on public.essay_results;
drop policy if exists quiz_results_insert on public.quiz_results;
drop policy if exists quiz_results_select on public.quiz_results;

alter table public.essay_submissions enable row level security;
drop policy if exists essay_submissions_service on public.essay_submissions;
create policy essay_submissions_service on public.essay_submissions
  for all to service_role using (true) with check (true);

revoke all on public.generated_questions from public, anon, authenticated;
revoke all on public.cached_themes from public, anon, authenticated;
revoke all on public.quiz_attempts from public, anon, authenticated;
revoke all on public.quiz_attempt_questions from public, anon, authenticated;
revoke all on public.essay_submissions from public, anon, authenticated;
revoke all on public.essay_results from public, anon, authenticated;
revoke all on public.quiz_results from public, anon, authenticated;

grant select, insert, update, delete on public.generated_questions to service_role;
grant select, insert, update, delete on public.cached_themes to service_role;
grant select, insert, update, delete on public.quiz_attempts to service_role;
grant select, insert, update, delete on public.quiz_attempt_questions to service_role;
grant select, insert, update, delete on public.essay_submissions to service_role;
grant select, insert, update, delete on public.essay_results to service_role;
grant select, insert, update, delete on public.quiz_results to service_role;

revoke all on function public.upsert_generated_question(jsonb) from public, anon, authenticated;
revoke all on function public.get_balanced_questions(text[], integer) from public, anon, authenticated;
revoke all on function public.upsert_cached_theme(uuid, boolean, jsonb) from public, anon, authenticated;
revoke all on function public.claim_cached_theme(uuid) from public, anon, authenticated;
revoke all on function public.get_cached_theme(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_quiz_attempt(uuid, uuid, uuid[], integer) from public, anon, authenticated;
revoke all on function public.submit_quiz_attempt(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.claim_essay_submission(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.complete_essay_submission(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.fail_essay_submission(uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.upsert_generated_question(jsonb) to service_role;
grant execute on function public.get_balanced_questions(text[], integer) to service_role;
grant execute on function public.upsert_cached_theme(uuid, boolean, jsonb) to service_role;
grant execute on function public.claim_cached_theme(uuid) to service_role;
grant execute on function public.get_cached_theme(uuid, uuid) to service_role;
grant execute on function public.create_quiz_attempt(uuid, uuid, uuid[], integer) to service_role;
grant execute on function public.submit_quiz_attempt(uuid, uuid, jsonb) to service_role;
grant execute on function public.claim_essay_submission(uuid, uuid, text) to service_role;
grant execute on function public.complete_essay_submission(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.fail_essay_submission(uuid, uuid, text, text) to service_role;

insert into public.configuracoes (chave, valor)
values
  ('maintenance:generated_questions:last_run_at', now()::text),
  ('maintenance:essay_submissions:last_run_at', now()::text)
on conflict (chave) do update set valor = excluded.valor;

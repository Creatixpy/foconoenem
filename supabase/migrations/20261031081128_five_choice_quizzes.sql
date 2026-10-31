-- New quizzes use five alternatives. Keep four-choice catalog rows and all
-- historical snapshots intact so already-issued attempts can still finish.
create or replace function private.valid_question_alternatives(p_alternatives jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select case when jsonb_typeof(p_alternatives) = 'array' then
    jsonb_array_length(p_alternatives) in (4, 5)
    and (
      select count(*) = jsonb_array_length(p_alternatives)
        and count(distinct btrim(alternative ->> 'id')) = jsonb_array_length(p_alternatives)
        and count(distinct private.normalize_catalog_text(alternative ->> 'text')) = jsonb_array_length(p_alternatives)
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
        and (
          jsonb_array_length(p_alternatives) = 4
          or count(*) filter (where alternative ->> 'id' in ('A', 'B', 'C', 'D', 'E')) = 5
        )
      from jsonb_array_elements(p_alternatives) alternative
    )
  else false end;
$$;

create or replace function public.get_balanced_questions_by_alternative_count(
  p_disciplines text[],
  p_alternative_count integer,
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
      and p_alternative_count in (4, 5)
      and jsonb_array_length(question.alternatives) = p_alternative_count
  )
  select
    id, discipline, content, alternatives, explanation,
    topic, difficulty, created_at, fingerprint
  from ranked
  where discipline_rank <= greatest(1, least(p_limit_per_discipline, 100));
$$;

-- The currently deployed four-choice app can continue using its existing RPC
-- during rollout; the updated app explicitly selects five-choice questions.
create or replace function public.get_balanced_questions(
  p_disciplines text[],
  p_limit_per_discipline integer default 20
)
returns setof public.generated_questions
language sql
security definer
set search_path = ''
as $$
  select *
  from public.get_balanced_questions_by_alternative_count(
    p_disciplines, 4, p_limit_per_discipline
  );
$$;

revoke all on function public.get_balanced_questions_by_alternative_count(text[], integer, integer)
  from public, anon, authenticated;
grant execute on function public.get_balanced_questions_by_alternative_count(text[], integer, integer)
  to service_role;

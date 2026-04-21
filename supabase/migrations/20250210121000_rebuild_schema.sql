begin;

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

drop function if exists public.recalculate_user_statistics(uuid) cascade;
drop function if exists public.cleanup_old_rate_limits() cascade;
drop function if exists public.update_updated_at_column() cascade;

drop table if exists public.analytics_events cascade;
drop table if exists public.quiz_results cascade;
drop table if exists public.essay_results cascade;
drop table if exists public.noticias cascade;
drop table if exists public.configuracoes cascade;
drop table if exists public.user_achievements cascade;
drop table if exists public.achievements cascade;
drop table if exists public.user_goals cascade;
drop table if exists public.user_statistics cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.cached_themes cascade;
drop table if exists public.rate_limits cascade;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type_enum') then
    create type public.event_type_enum as enum (
      'essay_submitted',
      'essay_viewed',
      'theme_generated',
      'theme_cached',
      'quiz_started',
      'quiz_completed',
      'page_view',
      'error_occurred'
    );
  end if;
end$$;

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_completo text,
  avatar_url text,
  bio text,
  objetivo text,
  ano_enem smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_user_id_key unique (user_id)
);

create table public.user_statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_redacoes integer not null default 0,
  media_nota_redacao numeric,
  melhor_nota_redacao integer,
  pior_nota_redacao integer,
  media_competencia1 numeric,
  media_competencia2 numeric,
  media_competencia3 numeric,
  media_competencia4 numeric,
  media_competencia5 numeric,
  total_simulados integer not null default 0,
  total_questoes_respondidas integer not null default 0,
  total_acertos integer not null default 0,
  total_erros integer not null default 0,
  taxa_acerto numeric,
  acertos_matematica integer not null default 0,
  total_matematica integer not null default 0,
  acertos_portugues integer not null default 0,
  total_portugues integer not null default 0,
  acertos_quimica integer not null default 0,
  total_quimica integer not null default 0,
  acertos_fisica integer not null default 0,
  total_fisica integer not null default 0,
  acertos_geografia integer not null default 0,
  total_geografia integer not null default 0,
  ultima_atualizacao timestamptz not null default now(),
  constraint user_statistics_user_id_key unique (user_id)
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (
    tipo = any (
      array['redacao_nota_minima', 'questoes_acerto_minimo', 'estudar_disciplina', 'praticar_competencia']
    )
  ),
  descricao text not null,
  valor_alvo numeric,
  disciplina text,
  competencia smallint,
  prazo date,
  concluida boolean not null default false,
  progresso numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  criteria jsonb,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  metadata jsonb,
  constraint user_achievements_user_achievement_key unique (user_id, achievement_id)
);

create table public.noticias (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  slug text not null,
  resumo text not null,
  conteudo text not null,
  imagem_url text,
  autor text,
  data_publicacao timestamptz not null default now(),
  tags text[] not null default '{}',
  destaque boolean not null default false,
  fonte_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(titulo, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(resumo, '')), 'B')
    || setweight(to_tsvector('portuguese', coalesce(conteudo, '')), 'C')
  ) stored,
  constraint noticias_slug_key unique (slug)
);

create table public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.essay_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  nota smallint not null check (nota between 0 and 1000),
  competencia1 jsonb not null,
  competencia2 jsonb not null,
  competencia3 jsonb not null,
  competencia4 jsonb not null,
  competencia5 jsonb not null,
  feedback_geral text not null,
  ponto_fortes text[] not null default '{}',
  pontos_a_melhorar text[] not null default '{}',
  redacao_original text not null,
  origem text not null check (origem = any (array['IA', 'Simulação'])),
  tema text,
  texto_apoio1 text,
  texto_apoio2 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  total_questions integer not null,
  correct_answers integer not null,
  wrong_answers integer not null,
  unanswered_questions integer not null,
  score integer not null,
  disciplines text[] not null,
  questions_data jsonb not null,
  answers_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type public.event_type_enum not null,
  metadata jsonb not null default '{}'::jsonb,
  user_ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

create table public.cached_themes (
  id uuid primary key default uuid_generate_v4(),
  tema text not null,
  texto_apoio1 text not null,
  texto_apoio2 text not null,
  usado_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  identifier text not null,
  endpoint text not null,
  request_count integer not null default 1,
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_user_profiles_user on public.user_profiles(user_id);
create index idx_user_profiles_created_at on public.user_profiles(created_at desc);
create index idx_user_statistics_user on public.user_statistics(user_id);
create index idx_user_goals_user on public.user_goals(user_id, created_at desc);
create index idx_user_goals_status on public.user_goals(user_id, concluida);
create index idx_user_achievements_user on public.user_achievements(user_id);
create index idx_user_achievements_achievement on public.user_achievements(achievement_id);
create index idx_noticias_published_at on public.noticias(data_publicacao desc);
create index idx_noticias_destaque on public.noticias(destaque, data_publicacao desc);
create index idx_noticias_search on public.noticias using gin(search_vector);
create index idx_essay_results_user on public.essay_results(user_id, created_at desc);
create index idx_essay_results_created on public.essay_results(created_at desc);
create index idx_quiz_results_user on public.quiz_results(user_id, created_at desc);
create index idx_analytics_events_user on public.analytics_events(user_id);
create index idx_analytics_events_type on public.analytics_events(event_type, created_at desc);
create index idx_cached_themes_usado on public.cached_themes(usado_count, created_at desc);
create index idx_rate_limits_identifier_endpoint on public.rate_limits(identifier, endpoint, window_start);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.cleanup_old_rate_limits()
returns void
language plpgsql
as $$
begin
  delete from public.rate_limits
   where window_start < now() - interval '1 hour';
end;
$$;

create or replace function public.recalculate_user_statistics(target_user_id uuid)
returns user_statistics
language plpgsql
security definer
set search_path to public
as $$
declare
  requester_role text := auth.role();
  requester_id uuid := auth.uid();
  v_result public.user_statistics;
begin
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
      coalesce(sum(wrong_answers), 0) as total_erros
    from public.quiz_results
    where user_id = target_user_id
  ),
  quiz_disciplines as (
    select
      sum(case when discipline = 'Matemática' and user_answer = correct_id then 1 else 0 end)::int as acertos_matematica,
      sum(case when discipline = 'Matemática' then 1 else 0 end)::int as total_matematica,
      sum(case when discipline = 'Português' and user_answer = correct_id then 1 else 0 end)::int as acertos_portugues,
      sum(case when discipline = 'Português' then 1 else 0 end)::int as total_portugues,
      sum(case when discipline = 'Química' and user_answer = correct_id then 1 else 0 end)::int as acertos_quimica,
      sum(case when discipline = 'Química' then 1 else 0 end)::int as total_quimica,
      sum(case when discipline = 'Física' and user_answer = correct_id then 1 else 0 end)::int as acertos_fisica,
      sum(case when discipline = 'Física' then 1 else 0 end)::int as total_fisica,
      sum(case when discipline = 'Geografia' and user_answer = correct_id then 1 else 0 end)::int as acertos_geografia,
      sum(case when discipline = 'Geografia' then 1 else 0 end)::int as total_geografia
    from (
      select
        (question->>'discipline') as discipline,
        (
          select alt->>'id'
            from jsonb_array_elements(question->'alternatives') as alt
           where (alt->>'isCorrect')::boolean
           limit 1
        ) as correct_id,
        (qr.answers_data ->> (question->>'id')) as user_answer
      from public.quiz_results qr
      cross join lateral jsonb_array_elements(qr.questions_data) as question
      where qr.user_id = target_user_id
    ) expanded
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
$$;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at_column();

create trigger trg_user_goals_updated_at
  before update on public.user_goals
  for each row execute function public.update_updated_at_column();

create trigger trg_noticias_updated_at
  before update on public.noticias
  for each row execute function public.update_updated_at_column();

create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.update_updated_at_column();

create trigger trg_essay_results_updated_at
  before update on public.essay_results
  for each row execute function public.update_updated_at_column();

alter table public.user_profiles enable row level security;
alter table public.user_statistics enable row level security;
alter table public.user_goals enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.noticias enable row level security;
alter table public.configuracoes enable row level security;
alter table public.essay_results enable row level security;
alter table public.quiz_results enable row level security;
alter table public.analytics_events enable row level security;
alter table public.cached_themes enable row level security;
alter table public.rate_limits enable row level security;

-- user_profiles policies
drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select"
  on public.user_profiles
  for select
  to authenticated
  using (true);

drop policy if exists "user_profiles_insert" on public.user_profiles;
create policy "user_profiles_insert"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update" on public.user_profiles;
create policy "user_profiles_update"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_delete" on public.user_profiles;
create policy "user_profiles_delete"
  on public.user_profiles
  for delete
  to service_role
  using (true);

-- user_statistics policies
create policy "user_statistics_select"
  on public.user_statistics
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_statistics_mutate"
  on public.user_statistics
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_statistics_service"
  on public.user_statistics
  for all
  to service_role
  using (true)
  with check (true);

-- user_goals policies
create policy "user_goals_select"
  on public.user_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_goals_mutate"
  on public.user_goals
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_goals_service"
  on public.user_goals
  for all
  to service_role
  using (true)
  with check (true);

-- achievements policies
create policy "achievements_select_public"
  on public.achievements
  for select
  to public
  using (true);

create policy "achievements_manage"
  on public.achievements
  for all
  to service_role
  using (true)
  with check (true);

-- user_achievements policies
create policy "user_achievements_select"
  on public.user_achievements
  for select
  to authenticated
  using (true);

create policy "user_achievements_insert"
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_achievements_delete"
  on public.user_achievements
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "user_achievements_service"
  on public.user_achievements
  for all
  to service_role
  using (true)
  with check (true);

-- noticias policies
create policy "noticias_select_public"
  on public.noticias
  for select
  to public
  using (true);

create policy "noticias_manage_service"
  on public.noticias
  for all
  to service_role
  using (true)
  with check (true);

-- configuracoes policies
create policy "configuracoes_service_only"
  on public.configuracoes
  for all
  to service_role
  using (true)
  with check (true);

-- essay_results policies
create policy "essay_results_select"
  on public.essay_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "essay_results_mutate"
  on public.essay_results
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "essay_results_service"
  on public.essay_results
  for all
  to service_role
  using (true)
  with check (true);

-- quiz_results policies
create policy "quiz_results_select"
  on public.quiz_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_results_mutate"
  on public.quiz_results
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quiz_results_service"
  on public.quiz_results
  for all
  to service_role
  using (true)
  with check (true);

-- analytics policies
create policy "analytics_insert_service"
  on public.analytics_events
  for insert
  to service_role
  with check (true);

create policy "analytics_insert_authenticated"
  on public.analytics_events
  for insert
  to authenticated
  with check (auth.uid()::text = coalesce(metadata->>'user_id', auth.uid()::text));

create policy "analytics_select_service"
  on public.analytics_events
  for select
  to service_role
  using (true);

-- cached themes policies
create policy "cached_themes_service"
  on public.cached_themes
  for all
  to service_role
  using (true)
  with check (true);

-- rate limits policies
create policy "rate_limits_public"
  on public.rate_limits
  for all
  to public
  using (true)
  with check (true);

commit;

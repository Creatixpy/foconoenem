begin;
-- Configurações extras no perfil para comunidade
alter table public.user_profiles
  add column if not exists is_over_16 boolean,
  add column if not exists community_age_confirmed_at timestamptz,
  add column if not exists community_terms_version text,
  add column if not exists community_terms_accepted_at timestamptz,
  add column if not exists community_tagline text,
  add column if not exists community_profile_theme text,
  add column if not exists community_show_statistics boolean not null default true;
update public.user_profiles
set community_show_statistics = coalesce(community_show_statistics, true)
where community_show_statistics is distinct from true;
-- Tabelas de conquistas
create table if not exists public.achievements (
  id uuid primary key default extensions.uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  criteria jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.user_achievements (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  metadata jsonb,
  unique (user_id, achievement_id)
);
create index if not exists idx_user_achievements_user on public.user_achievements(user_id);
create index if not exists idx_user_achievements_achievement on public.user_achievements(achievement_id);
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
drop policy if exists "Gamificação: listar conquistas" on public.achievements;
create policy "Gamificação: listar conquistas"
  on public.achievements
  for select
  to authenticated
  using (true);
drop policy if exists "Gamificação: usuário vê badges" on public.user_achievements;
create policy "Gamificação: usuário vê badges"
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Gamificação: usuário conquista badge" on public.user_achievements;
create policy "Gamificação: usuário conquista badge"
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Gamificação: usuário remove badge própria" on public.user_achievements;
create policy "Gamificação: usuário remove badge própria"
  on public.user_achievements
  for delete
  to authenticated
  using (auth.uid() = user_id);
insert into public.achievements (slug, name, description, icon, criteria)
values
  (
    'primeira_redacao',
    'Primeira Redação',
    'Envie sua primeira redação avaliada na plataforma.',
    '📝',
    jsonb_build_object('type', 'essay_count', 'threshold', 1)
  ),
  (
    'maratona_questoes',
    'Maratona de Questões',
    'Resolva ao menos 50 questões registradas.',
    '🏃',
    jsonb_build_object('type', 'question_count', 'threshold', 50)
  ),
  (
    'nota_mil',
    'Rumo à nota mil',
    'Alcance média de 900+ na redação.',
    '🌟',
    jsonb_build_object('type', 'essay_average', 'threshold', 900)
  ),
  (
    'mentor_comunitario',
    'Mentor Comunitário',
    'Faça 5 comentários aprovados na comunidade.',
    '🤝',
    jsonb_build_object('type', 'community_comments', 'threshold', 5)
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  criteria = excluded.criteria;
commit;

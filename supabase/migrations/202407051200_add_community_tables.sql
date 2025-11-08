begin;

create table if not exists public.community_topics (
  id uuid primary key default extensions.uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default extensions.uuid_generate_v4(),
  topic_id uuid not null references public.community_topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default extensions.uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_topic_created on public.community_posts(topic_id, created_at desc);
create index if not exists idx_comments_post_created on public.community_comments(post_id, created_at asc);

alter table public.community_topics enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "Comunidade: qualquer autent. lê tópicos" on public.community_topics;
create policy "Comunidade: qualquer autent. lê tópicos"
  on public.community_topics
  for select
  to authenticated
  using (true);

drop policy if exists "Comunidade: admins criam tópicos" on public.community_topics;
create policy "Comunidade: admins criam tópicos"
  on public.community_topics
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

drop policy if exists "Comunidade: qualquer autent. lê posts" on public.community_posts;
create policy "Comunidade: qualquer autent. lê posts"
  on public.community_posts
  for select
  to authenticated
  using (true);

drop policy if exists "Comunidade: usuário cria posts" on public.community_posts;
create policy "Comunidade: usuário cria posts"
  on public.community_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Comunidade: usuário atualiza posts próprios" on public.community_posts;
create policy "Comunidade: usuário atualiza posts próprios"
  on public.community_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Comunidade: usuário apaga posts próprios" on public.community_posts;
create policy "Comunidade: usuário apaga posts próprios"
  on public.community_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Comunidade: qualquer autent. lê comentários" on public.community_comments;
create policy "Comunidade: qualquer autent. lê comentários"
  on public.community_comments
  for select
  to authenticated
  using (true);

drop policy if exists "Comunidade: usuário comenta" on public.community_comments;
create policy "Comunidade: usuário comenta"
  on public.community_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Comunidade: usuário apaga comentário próprio" on public.community_comments;
create policy "Comunidade: usuário apaga comentário próprio"
  on public.community_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;

begin;

create table if not exists public.community_post_likes (
  id uuid primary key default extensions.uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_post_likes_post on public.community_post_likes(post_id);
create index if not exists idx_post_likes_user on public.community_post_likes(user_id);

alter table public.community_post_likes enable row level security;

drop policy if exists "Curtidas: qualquer autent. lê" on public.community_post_likes;
create policy "Curtidas: qualquer autent. lê"
  on public.community_post_likes
  for select
  to authenticated
  using (true);

drop policy if exists "Curtidas: usuário curte" on public.community_post_likes;
create policy "Curtidas: usuário curte"
  on public.community_post_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Curtidas: usuário remove" on public.community_post_likes;
create policy "Curtidas: usuário remove"
  on public.community_post_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;

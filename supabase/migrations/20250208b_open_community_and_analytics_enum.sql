begin;

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

alter table public.analytics_events
  alter column event_type type public.event_type_enum using event_type::public.event_type_enum;

-- Community SELECT policies for visitors

drop policy if exists "Comunidade: qualquer autent. lê tópicos" on public.community_topics;
create policy "Comunidade: qualquer um lê tópicos"
  on public.community_topics
  for select
  to public
  using (true);

-- posts

drop policy if exists "Comunidade: qualquer autent. lê posts" on public.community_posts;
create policy "Comunidade: qualquer um lê posts"
  on public.community_posts
  for select
  to public
  using (true);

-- comments

drop policy if exists "Comunidade: qualquer autent. lê comentários" on public.community_comments;
create policy "Comunidade: qualquer um lê comentários"
  on public.community_comments
  for select
  to public
  using (true);

-- likes

drop policy if exists "Curtidas: qualquer autent. lê" on public.community_post_likes;
create policy "Curtidas: qualquer um lê"
  on public.community_post_likes
  for select
  to public
  using (true);

commit;

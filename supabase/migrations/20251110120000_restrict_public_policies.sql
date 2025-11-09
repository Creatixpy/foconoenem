-- Remove policies that granted SELECT access to the implicit "public" role
-- and reapply them explicitly to the Supabase anon/authenticated roles.

drop policy if exists achievements_select_public on public.achievements;
create policy achievements_select_readonly
  on public.achievements
  for select
  to anon, authenticated
  using (true);

drop policy if exists noticias_select_public on public.noticias;
create policy noticias_select_readonly
  on public.noticias
  for select
  to anon, authenticated
  using (true);

drop policy if exists community_topics_select_public on public.community_topics;
create policy community_topics_select_readonly
  on public.community_topics
  for select
  to anon, authenticated
  using (true);

drop policy if exists community_posts_select_public on public.community_posts;
create policy community_posts_select_readonly
  on public.community_posts
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists community_comments_select_public on public.community_comments;
create policy community_comments_select_readonly
  on public.community_comments
  for select
  to anon, authenticated
  using (status = 'visible');

drop policy if exists community_likes_select_public on public.community_post_likes;
create policy community_likes_select_readonly
  on public.community_post_likes
  for select
  to anon, authenticated
  using (true);

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

begin;

drop policy if exists "Gamificação: usuário vê badges" on public.user_achievements;
create policy "Gamificação: visualiza badges públicas"
  on public.user_achievements
  for select
  to authenticated
  using (true);

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

commit;

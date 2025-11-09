begin;

drop policy if exists "Comunidade: admins criam tópicos" on public.community_topics;
create policy "Comunidade: criar tópicos via serviço" on public.community_topics
  for insert to service_role
  with check (true);

commit;

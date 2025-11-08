begin;

-- Índices auxiliares para feed e auditoria da comunidade
create index if not exists idx_posts_user_created on public.community_posts (user_id, created_at desc);
create index if not exists idx_comments_user_created on public.community_comments (user_id, created_at);

-- Reforça políticas das notícias para impedir inserção/edição direta por usuários comuns
drop policy if exists "Admins podem inserir notícias" on public.noticias;
drop policy if exists "Admins podem atualizar notícias" on public.noticias;
drop policy if exists "Admins podem deletar notícias" on public.noticias;

create policy "Notícias: inserir apenas via serviço" on public.noticias
  for insert
  to authenticated
  with check (false);

create policy "Notícias: atualizar apenas via serviço" on public.noticias
  for update
  to authenticated
  using (false)
  with check (false);

create policy "Notícias: remover apenas via serviço" on public.noticias
  for delete
  to authenticated
  using (false);

commit;

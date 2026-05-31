-- Reforça a segurança da tabela de rate limit, limitando o acesso ao service_role.
alter table if exists public.rate_limits enable row level security;

drop policy if exists "rate_limits_public" on public.rate_limits;

create policy "rate_limits_service_only"
  on public.rate_limits
  for all
  to service_role
  using (true)
  with check (true);

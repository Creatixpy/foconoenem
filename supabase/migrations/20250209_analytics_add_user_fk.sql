begin;

alter table public.analytics_events
  add column if not exists user_id uuid;

update public.analytics_events
   set user_id = (metadata ->> 'user_id')::uuid
 where user_id is null
   and metadata ? 'user_id'
   and (metadata ->> 'user_id') ~ '^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$';

alter table public.analytics_events
  drop constraint if exists analytics_events_user_id_fkey;

alter table public.analytics_events
  add constraint analytics_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);

drop policy if exists "Permitir inserção de eventos de analytics" on public.analytics_events;
drop policy if exists "Analytics: inserir via serviço" on public.analytics_events;
drop policy if exists "Analytics: inserir via clientes" on public.analytics_events;

create policy "Analytics: inserir via serviço" on public.analytics_events
  for insert to service_role
  with check (true);

create policy "Analytics: inserir via clientes autenticados" on public.analytics_events
  for insert to authenticated
  with check (auth.uid()::text = coalesce(metadata ->> 'user_id', auth.uid()::text));

commit;

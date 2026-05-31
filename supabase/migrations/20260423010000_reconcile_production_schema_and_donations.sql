-- Reconcile local schema history with production drift observed on 2026-04-23.
-- This migration is intentionally idempotent: it aligns missing auth bootstrap
-- objects, hardens RLS policies already present in production, removes obsolete
-- legacy maintenance RPCs, and introduces audited donation persistence.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, nome_completo, objetivo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), null)
  on conflict (user_id) do nothing;

  insert into public.user_statistics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists noticias_select_public on public.noticias;
drop policy if exists noticias_select_readonly on public.noticias;
drop policy if exists noticias_select on public.noticias;
drop policy if exists noticias_select_approved on public.noticias;
create policy noticias_select_approved
  on public.noticias
  for select
  to anon, authenticated
  using (status = 'aprovado');

drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_profiles_insert on public.user_profiles;
create policy user_profiles_insert
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_profiles_update on public.user_profiles;
create policy user_profiles_update
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_achievements_select on public.user_achievements;
create policy user_achievements_select
  on public.user_achievements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_statistics_select on public.user_statistics;
create policy user_statistics_select
  on public.user_statistics
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_goals_select on public.user_goals;
drop policy if exists user_goals_mutate on public.user_goals;
drop policy if exists user_goals_insert on public.user_goals;
drop policy if exists user_goals_update on public.user_goals;
drop policy if exists user_goals_delete on public.user_goals;

create policy user_goals_select
  on public.user_goals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy user_goals_insert
  on public.user_goals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_goals_update
  on public.user_goals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_goals_delete
  on public.user_goals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert
  on public.analytics_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists essay_results_select on public.essay_results;
create policy essay_results_select
  on public.essay_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists essay_results_insert on public.essay_results;
create policy essay_results_insert
  on public.essay_results
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists quiz_results_select on public.quiz_results;
create policy quiz_results_select
  on public.quiz_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists quiz_results_insert on public.quiz_results;
create policy quiz_results_insert
  on public.quiz_results
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Service role full access on admin_audit_log" on public.admin_audit_log;
drop policy if exists admin_audit_log_service_only on public.admin_audit_log;
create policy admin_audit_log_service_only
  on public.admin_audit_log
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists generated_questions_service on public.generated_questions;
create policy generated_questions_service
  on public.generated_questions
  for all
  to service_role
  using (true)
  with check (true);

drop index if exists public.idx_generated_questions_discipline;
drop index if exists public.idx_admin_audit_log_action;
create index if not exists idx_admin_audit_log_action
  on public.admin_audit_log (action, created_at desc);

drop function if exists public.cleanup_old_rate_limits();

create table if not exists public.donation_checkouts (
  id uuid primary key default gen_random_uuid(),
  client_reference_id uuid not null unique,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  donor_email text,
  donor_name text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'brl',
  status text not null default 'checkout_created'
    check (status in (
      'checkout_created',
      'checkout_failed',
      'checkout_completed',
      'paid',
      'expired',
      'payment_failed'
    )),
  request_ip text,
  request_user_agent text,
  checkout_url text,
  failure_reason text,
  latest_event_id text,
  latest_event_type text,
  latest_event_created_at timestamptz,
  expires_at timestamptz,
  completed_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  stripe_customer_details jsonb,
  session_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donation_checkouts_status_created
  on public.donation_checkouts (status, created_at desc);

create index if not exists idx_donation_checkouts_donor_email
  on public.donation_checkouts (donor_email);

create index if not exists idx_donation_checkouts_latest_event
  on public.donation_checkouts (latest_event_created_at desc nulls last);

drop trigger if exists trg_donation_checkouts_updated_at on public.donation_checkouts;
create trigger trg_donation_checkouts_updated_at
  before update on public.donation_checkouts
  for each row execute function public.update_updated_at_column();

alter table public.donation_checkouts enable row level security;

drop policy if exists donation_checkouts_service_only on public.donation_checkouts;
create policy donation_checkouts_service_only
  on public.donation_checkouts
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  livemode boolean not null default false,
  api_version text,
  checkout_session_id text,
  client_reference_id uuid references public.donation_checkouts (client_reference_id) on delete set null,
  event_created_at timestamptz not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_webhook_events_type_received
  on public.stripe_webhook_events (event_type, received_at desc);

create index if not exists idx_stripe_webhook_events_checkout_session
  on public.stripe_webhook_events (checkout_session_id);

drop trigger if exists trg_stripe_webhook_events_updated_at on public.stripe_webhook_events;
create trigger trg_stripe_webhook_events_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.update_updated_at_column();

alter table public.stripe_webhook_events enable row level security;

drop policy if exists stripe_webhook_events_service_only on public.stripe_webhook_events;
create policy stripe_webhook_events_service_only
  on public.stripe_webhook_events
  for all
  to service_role
  using (true)
  with check (true);

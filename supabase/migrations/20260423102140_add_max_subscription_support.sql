create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_code text not null default 'max'
    check (plan_code in ('max')),
  plan_name text not null default 'Max',
  provider text not null default 'stripe'
    check (provider = 'stripe'),
  status text not null default 'checkout_pending'
    check (
      status in (
        'checkout_pending',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      )
    ),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  latest_checkout_session_id text,
  latest_checkout_expires_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  renews_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (stripe_customer_id)
);

create index if not exists idx_subscriptions_status_plan_period
  on public.subscriptions (status, plan_code, current_period_end desc nulls last);

create index if not exists idx_subscriptions_renews_at
  on public.subscriptions (renews_at desc nulls last);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at_column();

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
  );

drop policy if exists subscriptions_service_only on public.subscriptions;
create policy subscriptions_service_only
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  stripe_event_id text not null unique,
  event_type text not null,
  livemode boolean not null default false,
  api_version text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  status text not null default 'received'
    check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  event_created_at timestamptz not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscription_events_user_received
  on public.subscription_events (user_id, received_at desc);

create index if not exists idx_subscription_events_subscription_received
  on public.subscription_events (stripe_subscription_id, received_at desc);

create index if not exists idx_subscription_events_type_received
  on public.subscription_events (event_type, received_at desc);

drop trigger if exists trg_subscription_events_updated_at on public.subscription_events;
create trigger trg_subscription_events_updated_at
  before update on public.subscription_events
  for each row execute function public.update_updated_at_column();

alter table public.subscription_events enable row level security;

drop policy if exists subscription_events_service_only on public.subscription_events;
create policy subscription_events_service_only
  on public.subscription_events
  for all
  to service_role
  using (true)
  with check (true);;

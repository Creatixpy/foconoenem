create index if not exists idx_stripe_webhook_events_client_reference
  on public.stripe_webhook_events (client_reference_id);

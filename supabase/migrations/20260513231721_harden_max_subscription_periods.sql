-- Harden Max subscription entitlement periods.
-- Safe notes:
-- - Fills missing access period fields from metadata already written by Stripe webhook sync.
-- - Does not delete or downgrade any subscription records.
-- - Prevents active/trialing rows with missing period data from becoming indefinite access rows.

update public.subscriptions
set
  current_period_start = coalesce(
    current_period_start,
    nullif(metadata ->> 'trial_used_at', '')::timestamptz
  ),
  current_period_end = coalesce(
    current_period_end,
    nullif(metadata ->> 'trial_ends_at', '')::timestamptz
  ),
  renews_at = case
    when cancel_at_period_end then null
    else coalesce(
      renews_at,
      current_period_end,
      nullif(metadata ->> 'trial_ends_at', '')::timestamptz
    )
  end
where status in ('active', 'trialing')
  and (
    current_period_end is null
    or (not cancel_at_period_end and renews_at is null)
  )
  and nullif(metadata ->> 'trial_ends_at', '') is not null;

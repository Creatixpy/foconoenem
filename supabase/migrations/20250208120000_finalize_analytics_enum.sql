begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type_enum') then
    create type public.event_type_enum as enum (
      'essay_submitted',
      'essay_viewed',
      'theme_generated',
      'theme_cached',
      'quiz_started',
      'quiz_completed',
      'page_view',
      'error_occurred'
    );
  end if;
end$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'analytics_events'
  ) then
    alter table public.analytics_events
      alter column event_type type public.event_type_enum using event_type::public.event_type_enum;
  end if;
end $$;

commit;

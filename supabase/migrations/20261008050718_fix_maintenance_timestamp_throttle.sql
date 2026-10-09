-- Preserve maintenance retention, serialization and server-only access.
-- Accept timestamps written by both prior ISO values and timestamptz::text.
create or replace function public.run_maintenance_task(p_task text)
returns table(ran boolean, deleted integer, ran_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  config_key text := 'maintenance:' || p_task || ':last_run_at';
  previous_value text;
  previous_run timestamptz;
  minimum_interval interval;
  deleted_rows integer := 0;
  current_run timestamptz := now();
begin
  minimum_interval := case p_task
    when 'rate_limits' then interval '15 minutes'
    when 'analytics_events' then interval '6 hours'
    when 'cached_themes' then interval '12 hours'
    when 'quiz_attempts' then interval '12 hours'
    when 'generated_questions' then interval '12 hours'
    when 'essay_submissions' then interval '12 hours'
    else null
  end;

  if minimum_interval is null then
    raise exception 'unknown_maintenance_task' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(config_key, 0));

  select valor
  into previous_value
  from public.configuracoes
  where chave = config_key;

  if previous_value ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ]' then
    begin
      previous_run := previous_value::timestamptz;
    exception when data_exception then
      -- A malformed stored timestamp must not block maintenance permanently.
      previous_run := null;
    end;
  end if;

  if previous_run is not null and current_run - previous_run < minimum_interval then
    return query select false, 0, previous_run;
    return;
  end if;

  if p_task = 'rate_limits' then
    delete from public.rate_limits where window_start < current_run - interval '1 hour';
  elsif p_task = 'analytics_events' then
    delete from public.analytics_events where created_at < current_run - interval '90 days';
  elsif p_task = 'cached_themes' then
    delete from public.cached_themes where created_at < current_run - interval '7 days';
  elsif p_task = 'quiz_attempts' then
    delete from public.quiz_attempts
    where (consumed_at is null and expires_at < current_run - interval '1 day')
       or (consumed_at is not null and consumed_at < current_run - interval '7 days');
  elsif p_task = 'generated_questions' then
    delete from public.generated_questions question
    where question.created_at < current_run - interval '30 days'
      and not exists (
        select 1 from public.quiz_attempt_questions attempt_question
        where attempt_question.question_id = question.id
      );
  else
    delete from public.essay_submissions
    where updated_at < current_run - interval '7 days';
  end if;

  get diagnostics deleted_rows = row_count;

  insert into public.configuracoes (chave, valor)
  values (config_key, to_char(current_run at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
  on conflict (chave) do update set valor = excluded.valor;

  return query select true, deleted_rows, current_run;
end;
$$;

revoke all on function public.run_maintenance_task(text) from public, anon, authenticated;
grant execute on function public.run_maintenance_task(text) to service_role;

-- Follow-up found by transactional validation of the canonical systems migration.

create index if not exists idx_essay_submissions_result
  on public.essay_submissions (result_id)
  where result_id is not null;

create or replace function private.question_fingerprint(
  p_discipline text,
  p_content text,
  p_alternatives jsonb
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select md5(
    private.normalize_catalog_text(p_discipline) || '|' ||
    private.normalize_catalog_text(p_content) || '|' ||
    coalesce((
      select string_agg(
        private.normalize_catalog_text(alternative ->> 'id') || ':' ||
        private.normalize_catalog_text(alternative ->> 'text') || ':' ||
        coalesce(alternative ->> 'isCorrect', ''),
        '|' order by ordinality
      )
      from jsonb_array_elements(p_alternatives)
        with ordinality values_list(alternative, ordinality)
    ), '')
  );
$$;

create or replace function public.claim_essay_submission(
  p_submission_id uuid,
  p_user_id uuid,
  p_input_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission_row public.essay_submissions;
begin
  if p_submission_id is null or p_user_id is null or nullif(p_input_fingerprint, '') is null then
    raise exception 'invalid_essay_submission' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 0));

  select * into submission_row
  from public.essay_submissions
  where submission_id = p_submission_id
  for update;

  if not found then
    insert into public.essay_submissions (submission_id, user_id, input_fingerprint)
    values (p_submission_id, p_user_id, p_input_fingerprint);
    return jsonb_build_object('state', 'claimed');
  end if;

  if submission_row.user_id <> p_user_id
     or submission_row.input_fingerprint <> p_input_fingerprint then
    return jsonb_build_object('state', 'conflict');
  end if;

  if submission_row.status = 'completed' then
    return jsonb_build_object('state', 'completed', 'resultId', submission_row.result_id);
  end if;

  if submission_row.status = 'failed'
     and submission_row.error_message like 'off_topic:%' then
    return jsonb_build_object(
      'state', 'off_topic',
      'justification', nullif(substring(submission_row.error_message from 11), '')
    );
  end if;

  if submission_row.status = 'failed'
     or submission_row.updated_at < now() - interval '5 minutes' then
    update public.essay_submissions
    set status = 'processing', error_message = null, updated_at = now()
    where submission_id = p_submission_id;
    return jsonb_build_object('state', 'claimed');
  end if;

  return jsonb_build_object('state', 'in_progress');
end;
$$;

revoke all on function public.claim_essay_submission(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_essay_submission(uuid, uuid, text)
  to service_role;

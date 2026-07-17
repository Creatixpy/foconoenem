-- Harden auth profile bootstrap and quiz result integrity.
-- Safe notes:
-- - Replaces the new-user trigger function without touching existing users.
-- - Adds constraints only after production rows were verified to satisfy them.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, nome_completo, objetivo)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nome_completo'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      new.email
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'objetivo'), '')
  )
  on conflict (user_id) do update
    set nome_completo = coalesce(public.user_profiles.nome_completo, excluded.nome_completo),
        objetivo = coalesce(public.user_profiles.objetivo, excluded.objetivo);

  insert into public.user_statistics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
grant execute on function public.handle_new_user() to service_role;

alter table public.quiz_results
  drop constraint if exists quiz_results_counts_nonnegative,
  add constraint quiz_results_counts_nonnegative
    check (
      total_questions >= 0
      and correct_answers >= 0
      and wrong_answers >= 0
      and unanswered_questions >= 0
      and score between 0 and 100
    ) not valid;

alter table public.quiz_results
  drop constraint if exists quiz_results_counts_match_total,
  add constraint quiz_results_counts_match_total
    check (total_questions = correct_answers + wrong_answers + unanswered_questions) not valid;

alter table public.quiz_results
  drop constraint if exists quiz_results_payload_lengths_match_total,
  add constraint quiz_results_payload_lengths_match_total
    check (
      jsonb_typeof(questions_data) = 'array'
      and jsonb_typeof(answers_data) = 'array'
      and case
        when jsonb_typeof(questions_data) = 'array'
          then jsonb_array_length(questions_data) = total_questions
        else false
      end
      and case
        when jsonb_typeof(answers_data) = 'array'
          then jsonb_array_length(answers_data) = total_questions
        else false
      end
    ) not valid;

alter table public.quiz_results validate constraint quiz_results_counts_nonnegative;
alter table public.quiz_results validate constraint quiz_results_counts_match_total;
alter table public.quiz_results validate constraint quiz_results_payload_lengths_match_total;;

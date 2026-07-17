create index if not exists idx_quiz_attempt_questions_question
  on public.quiz_attempt_questions (question_id);

create index if not exists idx_quiz_attempts_result
  on public.quiz_attempts (quiz_result_id)
  where quiz_result_id is not null;

create policy "Service role manages quiz attempts"
  on public.quiz_attempts
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service role manages quiz attempt questions"
  on public.quiz_attempt_questions
  for all
  to service_role
  using (true)
  with check (true);

CREATE TABLE IF NOT EXISTS public.generated_questions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  discipline text NOT NULL,
  content text NOT NULL,
  alternatives jsonb NOT NULL,
  explanation text,
  topic text,
  difficulty text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_questions_discipline_created
  ON public.generated_questions (discipline, created_at DESC);

ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS generated_questions_select ON public.generated_questions;
CREATE POLICY generated_questions_select
  ON public.generated_questions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS generated_questions_service ON public.generated_questions;
CREATE POLICY generated_questions_service
  ON public.generated_questions
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

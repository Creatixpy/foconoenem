-- Close public/profile data exposure discovered in the 2026-04-21 security audit.

-- Only approved news may be visible through anon/authenticated clients.
DROP POLICY IF EXISTS noticias_select_public ON public.noticias;
DROP POLICY IF EXISTS noticias_select_readonly ON public.noticias;
DROP POLICY IF EXISTS noticias_select ON public.noticias;

CREATE POLICY noticias_select_approved
  ON public.noticias
  FOR SELECT
  TO anon, authenticated
  USING (status = 'aprovado');

-- Profiles are private per user.
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;

CREATE POLICY "user_profiles_select"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements are also private per user.
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;

CREATE POLICY "user_achievements_select"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

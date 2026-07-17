
-- Fix user_profiles RLS: restrict SELECT to own profile only (except for community features)
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;

-- Policy for users to select their own profile
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for viewing community profiles (only if they have accepted terms and show statistics)
CREATE POLICY "user_profiles_select_community" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    community_terms_version IS NOT NULL 
    AND community_show_statistics = true
  );

-- Fix user_achievements RLS: restrict INSERT to service_role only
DROP POLICY IF EXISTS "user_achievements_insert" ON public.user_achievements;

CREATE POLICY "user_achievements_insert" ON public.user_achievements
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add missing indexes for foreign keys (performance improvement)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
  ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id 
  ON public.community_post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id 
  ON public.community_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
  ON public.user_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id 
  ON public.user_goals(user_id);

-- Add index for rate_limits cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start 
  ON public.rate_limits(window_start);
;

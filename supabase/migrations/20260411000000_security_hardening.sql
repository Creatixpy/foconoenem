-- Security hardening & audit migration
-- Consolidates all fixes from the comprehensive database audit (2026-04-11)
--
-- Critical fixes:
--   C1: community_comments SELECT policy used 'published' instead of 'visible'
--   C2: user_achievements INSERT allowed self-award
--   C3: anon could execute cleanup_old_rate_limits()
--   C4: anon could execute recalculate_user_statistics(uuid)
-- Important fixes:
--   I5: Drop dead increment_xp function
--   I6: Remove user_statistics mutate policy (users could fake stats)
--   I7: Replace {public} role with {anon, authenticated}
--   I8: Missing community_posts indexes

-- C1: Fix community_comments SELECT (published → visible)
DROP POLICY IF EXISTS community_comments_select ON public.community_comments;
CREATE POLICY community_comments_select
  ON public.community_comments FOR SELECT TO authenticated
  USING ((status = 'visible'::text) OR (auth.uid() = user_id));

-- C2: Remove user_achievements self-award INSERT
DROP POLICY IF EXISTS user_achievements_insert ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

-- C3: Revoke all non-service execution on cleanup_old_rate_limits
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- C4: Revoke anon on recalculate_user_statistics (note: signature is uuid, not void)
REVOKE ALL ON FUNCTION public.recalculate_user_statistics(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO service_role;

-- I5: Drop dead increment_xp function (references non-existent 'profiles' table)
DROP FUNCTION IF EXISTS public.increment_xp(integer, uuid);

-- I6: Remove user_statistics mutate policy — stats should be read-only for users
DROP POLICY IF EXISTS user_statistics_mutate ON public.user_statistics;

-- I7: Replace {public} role with explicit {anon, authenticated}
DROP POLICY IF EXISTS achievements_select_public ON public.achievements;
CREATE POLICY achievements_select
  ON public.achievements FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS noticias_select_public ON public.noticias;
CREATE POLICY noticias_select
  ON public.noticias FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS community_topics_select ON public.community_topics;
CREATE POLICY community_topics_select
  ON public.community_topics FOR SELECT TO anon, authenticated
  USING (true);

-- I8: Missing indexes for community queries
CREATE INDEX IF NOT EXISTS idx_community_posts_last_activity
  ON public.community_posts (last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_status_published
  ON public.community_posts (status)
  WHERE status = 'published';

-- M14: Add UPDATE policy for community_comments (allow editing own comments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can update own comments'
    AND tablename = 'community_comments'
  ) THEN
    CREATE POLICY "Users can update own comments"
      ON public.community_comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

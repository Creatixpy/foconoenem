
-- ============================================================
-- C1: Fix community_comments SELECT (published → visible)
-- ============================================================
DROP POLICY IF EXISTS community_comments_select ON public.community_comments;
CREATE POLICY community_comments_select
  ON public.community_comments FOR SELECT TO authenticated
  USING ((status = 'visible'::text) OR (auth.uid() = user_id));

-- ============================================================
-- C2: Remove user_achievements self-award INSERT
-- ============================================================
DROP POLICY IF EXISTS user_achievements_insert ON public.user_achievements;

-- ============================================================
-- C3: Revoke anon on cleanup_old_rate_limits
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon;

-- ============================================================
-- C4: Revoke anon on recalculate_user_statistics (correct signature)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) FROM anon;

-- ============================================================
-- I5: Drop dead increment_xp function
-- ============================================================
DROP FUNCTION IF EXISTS public.increment_xp(integer, uuid);

-- ============================================================
-- I6: Restrict user_statistics — remove mutate policy (keep read-only + service)
-- ============================================================
DROP POLICY IF EXISTS user_statistics_mutate ON public.user_statistics;

-- ============================================================
-- I7: Replace {public} with {anon, authenticated} on public-read tables
-- ============================================================
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

-- ============================================================
-- I8: Missing indexes for community queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_community_posts_last_activity
  ON public.community_posts (last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_status_published
  ON public.community_posts (status)
  WHERE status = 'published';
;

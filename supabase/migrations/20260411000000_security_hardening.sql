-- Security hardening migration from backend audit
-- Addresses: I13, I14, M13, M14

-- I13: Prevent users from self-awarding achievements
-- Drop the INSERT policy that allows authenticated users to insert arbitrary achievements
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

-- I14: Revoke anon EXECUTE on cleanup_old_rate_limits
-- Prevents anonymous users from wiping rate limit data
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon;

-- Also revoke anon EXECUTE on recalculate_user_statistics (only authenticated should use)
REVOKE EXECUTE ON FUNCTION public.recalculate_user_statistics() FROM anon;

-- M13: Add missing indexes for community query performance
CREATE INDEX IF NOT EXISTS idx_community_posts_last_activity_at
  ON public.community_posts (last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_status
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

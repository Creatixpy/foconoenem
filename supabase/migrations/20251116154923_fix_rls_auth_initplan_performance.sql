-- Fix RLS initplan: Wrap auth.uid() in SELECT to evaluate once per query

-- rate_limits
DROP POLICY IF EXISTS rate_limits_user_manage ON public.rate_limits;
CREATE POLICY rate_limits_user_manage ON public.rate_limits
  FOR ALL TO authenticated
  USING (identifier = (SELECT auth.uid())::text)
  WITH CHECK (identifier = (SELECT auth.uid())::text);

-- user_achievements insert
DROP POLICY IF EXISTS user_achievements_insert ON public.user_achievements;
CREATE POLICY user_achievements_insert ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- user_achievements delete
DROP POLICY IF EXISTS user_achievements_delete ON public.user_achievements;
CREATE POLICY user_achievements_delete ON public.user_achievements
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- user_profiles insert
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- user_profiles update
DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- user_statistics select
DROP POLICY IF EXISTS user_statistics_select ON public.user_statistics;
CREATE POLICY user_statistics_select ON public.user_statistics
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- user_statistics mutate (ALL)
DROP POLICY IF EXISTS user_statistics_mutate ON public.user_statistics;
CREATE POLICY user_statistics_mutate ON public.user_statistics
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- user_goals select
DROP POLICY IF EXISTS user_goals_select ON public.user_goals;
CREATE POLICY user_goals_select ON public.user_goals
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- user_goals mutate
DROP POLICY IF EXISTS user_goals_mutate ON public.user_goals;
CREATE POLICY user_goals_mutate ON public.user_goals
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- essay_results select
DROP POLICY IF EXISTS essay_results_select ON public.essay_results;
CREATE POLICY essay_results_select ON public.essay_results
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- essay_results mutate
DROP POLICY IF EXISTS essay_results_mutate ON public.essay_results;
CREATE POLICY essay_results_mutate ON public.essay_results
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- quiz_results select
DROP POLICY IF EXISTS quiz_results_select ON public.quiz_results;
CREATE POLICY quiz_results_select ON public.quiz_results
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- quiz_results mutate
DROP POLICY IF EXISTS quiz_results_mutate ON public.quiz_results;
CREATE POLICY quiz_results_mutate ON public.quiz_results
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- analytics_events insert_authenticated
DROP POLICY IF EXISTS analytics_insert_authenticated ON public.analytics_events;
CREATE POLICY analytics_insert_authenticated ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.uid())::text = COALESCE((metadata ->> 'user_id'::text), (SELECT auth.uid())::text)));

-- community_posts insert
DROP POLICY IF EXISTS community_posts_insert ON public.community_posts;
CREATE POLICY community_posts_insert ON public.community_posts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- community_posts update
DROP POLICY IF EXISTS community_posts_update ON public.community_posts;
CREATE POLICY community_posts_update ON public.community_posts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- community_posts delete
DROP POLICY IF EXISTS community_posts_delete ON public.community_posts;
CREATE POLICY community_posts_delete ON public.community_posts
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- community_comments insert
DROP POLICY IF EXISTS community_comments_insert ON public.community_comments;
CREATE POLICY community_comments_insert ON public.community_comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- community_comments delete
DROP POLICY IF EXISTS community_comments_delete ON public.community_comments;
CREATE POLICY community_comments_delete ON public.community_comments
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- community_post_likes insert
DROP POLICY IF EXISTS community_likes_insert ON public.community_post_likes;
CREATE POLICY community_likes_insert ON public.community_post_likes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- community_post_likes delete
DROP POLICY IF EXISTS community_likes_delete ON public.community_post_likes;
CREATE POLICY community_likes_delete ON public.community_post_likes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);;

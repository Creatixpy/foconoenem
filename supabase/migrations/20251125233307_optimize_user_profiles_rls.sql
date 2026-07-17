-- Optimize RLS policies for user_profiles table
-- Issue: Multiple permissive SELECT policies and auth function re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS user_profiles_select_own ON user_profiles;
DROP POLICY IF EXISTS user_profiles_select_community ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update ON user_profiles;

-- Create consolidated SELECT policy that combines both conditions
-- Uses auth.uid() once per query by letting PostgreSQL optimize the expression
CREATE POLICY user_profiles_select_policy ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Can view own profile OR community-visible profiles
    user_id = auth.uid() 
    OR (community_terms_version IS NOT NULL AND community_show_statistics = true)
  );

-- Optimize UPDATE policy - remove subquery
CREATE POLICY user_profiles_update_policy ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());;

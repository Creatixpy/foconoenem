-- Optimize RLS policies by wrapping auth.uid() in SELECT to evaluate once per query
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop and recreate all user_profiles policies with optimized auth calls
DROP POLICY IF EXISTS user_profiles_select_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_policy ON user_profiles;

-- SELECT: View own profile OR community-visible profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR (community_terms_version IS NOT NULL AND community_show_statistics = true)
  );

-- UPDATE: Only own profile
CREATE POLICY user_profiles_update_policy ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- INSERT: Only for own user_id
CREATE POLICY user_profiles_insert_policy ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE: Only own profile
CREATE POLICY user_profiles_delete_policy ON user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));;

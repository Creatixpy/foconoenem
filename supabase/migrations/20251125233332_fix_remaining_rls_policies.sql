-- Fix remaining RLS policies for user_profiles

-- Fix INSERT policy - remove subquery
DROP POLICY IF EXISTS user_profiles_insert ON user_profiles;
CREATE POLICY user_profiles_insert_policy ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix DELETE policy - should only allow users to delete their own profile
DROP POLICY IF EXISTS user_profiles_delete ON user_profiles;
CREATE POLICY user_profiles_delete_policy ON user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());;

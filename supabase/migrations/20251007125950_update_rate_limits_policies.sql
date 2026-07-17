-- Drop overly restrictive policy
DROP POLICY IF EXISTS "Apenas sistema pode gerenciar rate limits" ON public.rate_limits;

-- Allow anon and authenticated roles to read/write rate limits entries
CREATE POLICY "Allow public rate limit access"
  ON public.rate_limits
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
;


-- Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by admin and time
CREATE INDEX idx_admin_audit_log_email_created ON public.admin_audit_log (admin_email, created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log (action, created_at DESC);

-- RLS: only service_role can insert/read
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_audit_log"
  ON public.admin_audit_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
;

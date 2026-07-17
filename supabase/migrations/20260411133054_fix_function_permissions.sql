
-- Revoke EXECUTE from PUBLIC (which includes anon), then grant back to specific roles
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

REVOKE ALL ON FUNCTION public.recalculate_user_statistics(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_user_statistics(uuid) TO service_role;
;

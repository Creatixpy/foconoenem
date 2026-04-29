-- Public news is now served by server-side route handlers using service_role.
-- Keep the anon and authenticated roles without direct table grants.

revoke all privileges on table public.noticias from anon;
revoke all privileges on table public.noticias from authenticated;

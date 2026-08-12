-- La tabla fue creada después de los grants iniciales del proyecto. Postgres
-- exige privilegios de tabla además de las políticas RLS.
grant usage on schema public to authenticated, service_role;
grant select on table public.quote_requests to authenticated;
grant all privileges on table public.quote_requests to service_role;


-- RLS decide qué filas puede usar cada rol; estos GRANT habilitan las operaciones SQL.
grant usage on schema public to anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;

grant insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.product_images to authenticated;
grant select, insert, update, delete on table public.inventory_movements to authenticated;
grant select, insert, update, delete on table public.inventory_alerts to authenticated;

-- Las acciones administrativas del servidor usan SUPABASE_SERVICE_ROLE_KEY.
grant all privileges on table public.categories to service_role;
grant all privileges on table public.products to service_role;
grant all privileges on table public.product_images to service_role;
grant all privileges on table public.inventory_movements to service_role;
grant all privileges on table public.inventory_alerts to service_role;
grant all privileges on table public.audit_logs to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Mantiene las escrituras protegidas por las políticas staff products ya instaladas.
-- El visitante anónimo conserva únicamente lectura de productos activos.

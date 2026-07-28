-- Las tablas de inventario ya existían en el esquema inicial pero nunca se activó RLS sobre
-- ellas, así que cualquier usuario autenticado podía leerlas/escribirlas directo con la
-- anon/authenticated key. Se restringe a personal (admin/supervisor); las acciones del panel
-- siguen escribiendo con SUPABASE_SERVICE_ROLE_KEY, que no pasa por RLS.
alter table public.inventory_movements enable row level security;
alter table public.inventory_alerts enable row level security;
alter table public.inventory_reservations enable row level security;

create policy "staff inventory movements" on public.inventory_movements
  for select using(has_role('admin') or has_role('supervisor'));

create policy "staff inventory alerts" on public.inventory_alerts
  for all using(has_role('admin') or has_role('supervisor'))
  with check(has_role('admin') or has_role('supervisor'));

create policy "staff inventory reservations" on public.inventory_reservations
  for select using(has_role('admin') or has_role('supervisor'));

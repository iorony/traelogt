-- RLS ya limita cada consulta al customer_id del usuario autenticado. Estos
-- grants habilitan la lectura a nivel PostgreSQL para que las políticas puedan
-- evaluarse desde Mi cuenta.
grant usage on schema public to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;


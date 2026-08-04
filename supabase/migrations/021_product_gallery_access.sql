-- Galería pública únicamente para productos publicados. La administración usa
-- el cliente de servicio y mantiene la escritura fuera del navegador.
alter table public.product_images enable row level security;
grant select on table public.product_images to anon,authenticated;

drop policy if exists "public product galleries" on public.product_images;
create policy "public product galleries" on public.product_images for select
using(exists(select 1 from public.products p where p.id=product_id and p.is_active and p.status='active' and p.deleted_at is null));

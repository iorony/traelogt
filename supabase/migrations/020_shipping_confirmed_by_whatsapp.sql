-- El envío no forma parte del total inicial del pedido. Se acuerda después
-- por WhatsApp según la ubicación del cliente.
update public.store_settings set shipping_cost=0,updated_at=now() where id=true;

-- Compatibilidad para instalaciones que aplicaron la función de checkout
-- anterior: permite omitir la ubicación sin rechazar el pedido.
alter table public.orders alter column address drop not null;
alter table public.orders alter column department drop not null;
alter table public.orders alter column municipality drop not null;

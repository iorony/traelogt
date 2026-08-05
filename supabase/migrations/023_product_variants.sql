create table if not exists public.product_variants(
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12,2) check(price is null or price>=0),
  stock integer not null default 0 check(stock>=0),
  reserved_stock integer not null default 0 check(reserved_stock>=0 and reserved_stock<=stock),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id,name)
);
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id);
alter table public.inventory_reservations add column if not exists variant_id uuid references public.product_variants(id);
alter table public.product_variants enable row level security;
grant select on public.product_variants to anon,authenticated;
grant all privileges on public.product_variants to service_role;
create policy "public active variants" on public.product_variants for select using(is_active and exists(select 1 from products p where p.id=product_id and p.is_active and p.status='active' and p.deleted_at is null));

create or replace function public.create_order_atomic(payload jsonb, customer_uuid uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  new_order_id uuid:=gen_random_uuid(); yr text:=to_char(now() at time zone 'America/Guatemala','YYYY');order_no text;tracking text;
  subtotal_value numeric(12,2):=0;shipping_value numeric(12,2):=0;total_value numeric(12,2);item jsonb;product_row products%rowtype;
  variant_row product_variants%rowtype;qty integer;unit_value numeric(12,2);whatsapp_number text;variant_uuid uuid;has_variants boolean;
begin
  if jsonb_array_length(payload->'items')=0 then raise exception 'EMPTY_ORDER'; end if;
  order_no:='PED-'||yr||'-'||lpad(nextval('order_number_seq')::text,6,'0');
  loop tracking:='GT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));exit when not exists(select 1 from orders where tracking_code=tracking);end loop;
  select whatsapp into whatsapp_number from store_settings where id=true;
  for item in select entry.value from jsonb_array_elements(payload->'items') entry(value) loop
    qty:=(item->>'quantity')::integer;variant_uuid:=nullif(item->>'variantId','')::uuid;
    select * into product_row from products where id=(item->>'productId')::uuid and status='active' and is_active and deleted_at is null for update;
    if not found or qty<1 then raise exception 'STOCK_UNAVAILABLE'; end if;
    select exists(select 1 from product_variants where product_id=product_row.id and is_active) into has_variants;
    if has_variants and variant_uuid is null then raise exception 'VARIANT_REQUIRED'; end if;
    if variant_uuid is not null then
      select * into variant_row from product_variants where id=variant_uuid and product_id=product_row.id and is_active for update;
      if not found or variant_row.stock-variant_row.reserved_stock<qty then raise exception 'STOCK_UNAVAILABLE'; end if;
    elsif not product_row.allow_backorder and product_row.stock-product_row.reserved_stock<qty then raise exception 'STOCK_UNAVAILABLE'; end if;
    unit_value:=case when variant_uuid is not null then coalesce(variant_row.price,product_row.sale_price,product_row.price) else coalesce(product_row.sale_price,product_row.price) end;subtotal_value:=subtotal_value+unit_value*qty;
  end loop;
  total_value:=subtotal_value;
  insert into orders(id,order_number,tracking_code,customer_id,is_guest,buyer_first_name,buyer_last_name,phone,email,address,department,municipality,zone,reference,subtotal,shipping_cost,total,payment_method,payment_status,status,customer_notes)
  values(new_order_id,order_no,tracking,customer_uuid,customer_uuid is null,payload->>'firstName',payload->>'lastName',regexp_replace(payload->>'phone','\D','','g'),nullif(payload->>'email',''),coalesce(nullif(btrim(payload->>'address'),''),'Por confirmar en WhatsApp'),coalesce(nullif(btrim(payload->>'department'),''),'Por confirmar'),coalesce(nullif(btrim(payload->>'municipality'),''),'Por confirmar'),nullif(payload->>'zone',''),coalesce(nullif(btrim(payload->>'reference'),''),'Por confirmar en WhatsApp'),subtotal_value,0,total_value,payload->>'paymentMethod','pending',case when payload->>'paymentMethod'='bank_transfer' then 'pending_payment'::order_status else 'pending_confirmation'::order_status end,nullif(payload->>'notes',''));
  for item in select entry.value from jsonb_array_elements(payload->'items') entry(value) loop
    qty:=(item->>'quantity')::integer;variant_uuid:=nullif(item->>'variantId','')::uuid;select * into product_row from products where id=(item->>'productId')::uuid for update;
    if variant_uuid is not null then select * into variant_row from product_variants where id=variant_uuid for update; end if;
    unit_value:=case when variant_uuid is not null then coalesce(variant_row.price,product_row.sale_price,product_row.price) else coalesce(product_row.sale_price,product_row.price) end;
    insert into order_items(order_id,product_id,variant_id,sku,product_name,unit_price,quantity,subtotal,image_url,variant_details)
    values(new_order_id,product_row.id,variant_uuid,product_row.sku,product_row.name,unit_value,qty,unit_value*qty,product_row.main_image_url,case when variant_uuid is null then null else variant_row.name end);
    update products set reserved_stock=reserved_stock+qty where id=product_row.id;
    if variant_uuid is not null then update product_variants set reserved_stock=reserved_stock+qty,updated_at=now() where id=variant_uuid; end if;
    insert into inventory_reservations(product_id,variant_id,order_id,quantity,expires_at) values(product_row.id,variant_uuid,new_order_id,qty,now()+(coalesce((select reservation_hours from store_settings where id=true),24)||' hours')::interval);
  end loop;
  insert into order_status_history(order_id,new_status,public_comment) values(new_order_id,case when payload->>'paymentMethod'='bank_transfer' then 'pending_payment'::order_status else 'pending_confirmation'::order_status end,'Pedido recibido correctamente');
  return jsonb_build_object('orderNumber',order_no,'trackingCode',tracking,'total',total_value,'whatsappUrl','https://wa.me/'||regexp_replace(whatsapp_number,'\D','','g')||'?text='||replace('Hola, deseo confirmar mi pedido. Pedido: '||order_no||' Código: '||tracking||' Productos: Q '||to_char(total_value,'FM999999990.00')||'. Envío por confirmar según ubicación.',' ','%20'));
end$$;
revoke all on function public.create_order_atomic(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.create_order_atomic(jsonb,uuid) to service_role;

-- Actualiza también el inventario específico de variante al liberar o consumir.
create or replace function public.sync_order_reservations_on_status()
returns trigger language plpgsql security definer set search_path=public as $$
declare reservation record;
begin
  if new.status=old.status then return new; end if;
  if new.status in ('cancelled','rejected','returned') then
    for reservation in select * from inventory_reservations where order_id=new.id and status='active' for update loop
      update products set reserved_stock=greatest(0,reserved_stock-reservation.quantity) where id=reservation.product_id;
      if reservation.variant_id is not null then update product_variants set reserved_stock=greatest(0,reserved_stock-reservation.quantity),updated_at=now() where id=reservation.variant_id; end if;
      update inventory_reservations set status='released' where id=reservation.id;
    end loop;
  elsif new.status='delivered' then
    for reservation in select * from inventory_reservations where order_id=new.id and status='active' for update loop
      update products set stock=stock-reservation.quantity,reserved_stock=greatest(0,reserved_stock-reservation.quantity) where id=reservation.product_id and stock>=reservation.quantity;
      if reservation.variant_id is not null then update product_variants set stock=stock-reservation.quantity,reserved_stock=greatest(0,reserved_stock-reservation.quantity),updated_at=now() where id=reservation.variant_id and stock>=reservation.quantity; end if;
      update inventory_reservations set status='consumed' where id=reservation.id;
    end loop;
  end if;return new;
end$$;

create or replace function public.change_order_status(order_uuid uuid,target_status public.order_status,actor_uuid uuid,public_note text default null,internal_note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare current_status public.order_status;allowed boolean:=false;
begin
  select status into current_status from orders where id=order_uuid for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if current_status=target_status then return; end if;
  allowed:=case current_status
    when 'pending_confirmation' then target_status in ('confirmed','cancelled','rejected')
    when 'pending_payment' then target_status in ('payment_review','confirmed','cancelled','rejected')
    when 'payment_review' then target_status in ('confirmed','pending_payment','cancelled','rejected')
    when 'confirmed' then target_status in ('preparing','cancelled')
    when 'preparing' then target_status in ('packed','cancelled')
    when 'packed' then target_status in ('shipped','cancelled')
    when 'shipped' then target_status in ('delivered','returned') else false end;
  if not allowed then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  update orders set status=target_status,confirmed_at=case when target_status='confirmed' then now() else confirmed_at end,packed_at=case when target_status='packed' then now() else packed_at end,shipped_at=case when target_status='shipped' then now() else shipped_at end,delivered_at=case when target_status='delivered' then now() else delivered_at end where id=order_uuid;
  insert into order_status_history(order_id,old_status,new_status,public_comment,internal_comment,responsible_user) values(order_uuid,current_status,target_status,nullif(btrim(public_note),''),nullif(btrim(internal_note),''),actor_uuid);
end$$;

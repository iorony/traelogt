-- Garantiza que ningún pedido terminal conserve inventario reservado, incluso
-- si el estado se cambia fuera de change_order_status.
create or replace function public.sync_order_reservations_on_status()
returns trigger language plpgsql security definer set search_path=public as $$
declare reservation record;
begin
  if new.status=old.status then return new; end if;

  if new.status in ('cancelled','rejected','returned') then
    for reservation in
      select * from inventory_reservations where order_id=new.id and status='active' for update
    loop
      update products
        set reserved_stock=greatest(0,reserved_stock-reservation.quantity)
        where id=reservation.product_id;
      update inventory_reservations set status='released' where id=reservation.id;
      insert into inventory_movements(product_id,order_id,previous_quantity,quantity_change,resulting_quantity,movement_type,reason)
      select id,new.id,stock,0,stock,'reservation_release','Liberación automática por estado '||new.status::text
      from products where id=reservation.product_id;
    end loop;
  elsif new.status='delivered' then
    for reservation in
      select * from inventory_reservations where order_id=new.id and status='active' for update
    loop
      update products
        set stock=stock-reservation.quantity,
            reserved_stock=greatest(0,reserved_stock-reservation.quantity)
        where id=reservation.product_id and stock>=reservation.quantity;
      if not found then raise exception 'STOCK_INCONSISTENT'; end if;
      update inventory_reservations set status='consumed' where id=reservation.id;
      insert into inventory_movements(product_id,order_id,previous_quantity,quantity_change,resulting_quantity,movement_type,reason)
      select id,new.id,stock+reservation.quantity,-reservation.quantity,stock,'sale','Consumo automático al entregar'
      from products where id=reservation.product_id;
    end loop;
  end if;
  return new;
end$$;

drop trigger if exists orders_sync_reservations on public.orders;
create trigger orders_sync_reservations
after update of status on public.orders
for each row execute function public.sync_order_reservations_on_status();

-- Repara datos creados antes de este control.
insert into public.inventory_movements(product_id,order_id,previous_quantity,quantity_change,resulting_quantity,movement_type,reason)
select r.product_id,r.order_id,p.stock,0,p.stock,'reservation_release','Reconciliación de pedido terminal'
from public.inventory_reservations r
join public.orders o on o.id=r.order_id
join public.products p on p.id=r.product_id
where r.status='active' and o.status in ('cancelled','rejected','returned');

update public.inventory_reservations r
set status='released'
from public.orders o
where r.order_id=o.id
  and r.status='active'
  and o.status in ('cancelled','rejected','returned');

update public.products p
set reserved_stock=coalesce((
  select sum(r.quantity)::integer
  from public.inventory_reservations r
  where r.product_id=p.id and r.status='active'
),0);

-- Vence pedidos pendientes que superaron la duración configurada.
create or replace function public.expire_order_reservations()
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer:=0; order_row record;
begin
  for order_row in
    select o.id,o.status from orders o
    where o.status in ('pending_confirmation','pending_payment','payment_review')
      and exists(select 1 from inventory_reservations r where r.order_id=o.id and r.status='active' and r.expires_at<=now())
    for update
  loop
    update orders set status='cancelled' where id=order_row.id;
    insert into order_status_history(order_id,old_status,new_status,public_comment,internal_comment)
    values(order_row.id,order_row.status,'cancelled','Pedido vencido; la reserva fue liberada','Vencimiento automático de reserva');
    affected:=affected+1;
  end loop;
  return affected;
end$$;

revoke all on function public.expire_order_reservations() from public,anon,authenticated;
grant execute on function public.expire_order_reservations() to service_role;

create or replace function public.change_order_status(order_uuid uuid,target_status public.order_status,actor_uuid uuid,public_note text default null,internal_note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare current_status public.order_status; reservation record; allowed boolean:=false;
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
    when 'shipped' then target_status in ('delivered','returned')
    else false end;
  if not allowed then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  if target_status in ('cancelled','rejected','returned') then
    for reservation in select * from inventory_reservations where order_id=order_uuid and status='active' for update loop
      update products set reserved_stock=greatest(0,reserved_stock-reservation.quantity) where id=reservation.product_id;
      update inventory_reservations set status='released' where id=reservation.id;
      insert into inventory_movements(product_id,order_id,previous_quantity,quantity_change,resulting_quantity,movement_type,reason,responsible_user)
      select id,order_uuid,stock,0,stock,'reservation_release',coalesce(internal_note,'Pedido cancelado'),actor_uuid from products where id=reservation.product_id;
    end loop;
  elsif target_status='delivered' then
    for reservation in select * from inventory_reservations where order_id=order_uuid and status='active' for update loop
      update products set stock=stock-reservation.quantity,reserved_stock=greatest(0,reserved_stock-reservation.quantity) where id=reservation.product_id and stock>=reservation.quantity;
      if not found then raise exception 'STOCK_INCONSISTENT'; end if;
      update inventory_reservations set status='consumed' where id=reservation.id;
      insert into inventory_movements(product_id,order_id,previous_quantity,quantity_change,resulting_quantity,movement_type,reason,responsible_user)
      select id,order_uuid,stock+reservation.quantity,-reservation.quantity,stock,'sale','Pedido entregado',actor_uuid from products where id=reservation.product_id;
    end loop;
  end if;
  update orders set status=target_status,confirmed_at=case when target_status='confirmed' then now() else confirmed_at end,packed_at=case when target_status='packed' then now() else packed_at end,shipped_at=case when target_status='shipped' then now() else shipped_at end,delivered_at=case when target_status='delivered' then now() else delivered_at end where id=order_uuid;
  insert into order_status_history(order_id,old_status,new_status,public_comment,internal_comment,responsible_user) values(order_uuid,current_status,target_status,nullif(btrim(public_note),''),nullif(btrim(internal_note),''),actor_uuid);
end$$;
revoke all on function public.change_order_status(uuid,public.order_status,uuid,text,text) from public,anon,authenticated;
grant execute on function public.change_order_status(uuid,public.order_status,uuid,text,text) to service_role;

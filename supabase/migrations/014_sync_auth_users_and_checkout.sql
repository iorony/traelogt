insert into public.profiles(id,email,first_name,last_name,status,created_at,updated_at)
select u.id,coalesce(u.email,''),coalesce(u.raw_user_meta_data->>'first_name',''),coalesce(u.raw_user_meta_data->>'last_name',''),'active',coalesce(u.created_at,now()),now()
from auth.users u
on conflict(id) do update set email=excluded.email,updated_at=now();

insert into public.user_roles(user_id,role_id)
select p.id,r.id from public.profiles p cross join public.roles r
where r.name='customer' and not exists(select 1 from public.user_roles ur where ur.user_id=p.id)
on conflict do nothing;

grant all privileges on table public.profiles to service_role;
grant all privileges on table public.roles to service_role;
grant all privileges on table public.user_roles to service_role;
grant all privileges on table public.addresses to service_role;
grant all privileges on table public.orders to service_role;
grant all privileges on table public.order_items to service_role;
grant all privileges on table public.order_status_history to service_role;
grant all privileges on table public.inventory_reservations to service_role;
grant all privileges on table public.store_settings to service_role;
grant usage,select on all sequences in schema public to service_role;
notify pgrst,'reload schema';

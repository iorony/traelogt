-- Repara cuentas creadas en Supabase Auth antes de instalar el trigger de perfiles.
insert into public.profiles(id,email,first_name,last_name,status,created_at,updated_at)
select u.id,coalesce(u.email,''),coalesce(u.raw_user_meta_data->>'first_name',u.raw_user_meta_data->>'name',''),coalesce(u.raw_user_meta_data->>'last_name',''),'active',coalesce(u.created_at,now()),now()
from auth.users u
where not exists(select 1 from public.profiles p where p.id=u.id)
on conflict(id) do nothing;

insert into public.user_roles(user_id,role_id)
select p.id,r.id from public.profiles p cross join public.roles r
where r.name='customer' and not exists(select 1 from public.user_roles ur where ur.user_id=p.id)
on conflict do nothing;

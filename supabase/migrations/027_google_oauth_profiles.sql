create or replace function public.on_auth_user_created()
returns trigger language plpgsql security definer set search_path=public as $$
declare customer_role smallint;
begin
  insert into profiles(id,email,first_name,last_name,status)
  values(
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'given_name',split_part(coalesce(new.raw_user_meta_data->>'full_name',''),' ',1),''),
    coalesce(new.raw_user_meta_data->>'last_name',new.raw_user_meta_data->>'family_name',nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'full_name',''),'^[^ ]+\s*',''),''),''),
    'active'
  ) on conflict(id) do update set email=excluded.email,first_name=case when profiles.first_name='' then excluded.first_name else profiles.first_name end,last_name=case when profiles.last_name='' then excluded.last_name else profiles.last_name end,updated_at=now();
  select id into customer_role from roles where name='customer';
  insert into user_roles(user_id,role_id) values(new.id,customer_role) on conflict do nothing;
  return new;
end$$;

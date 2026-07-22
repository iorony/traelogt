# Crear el primer administrador global

Primero crea la cuenta en `/registro` y confirma el correo. Después abre **SQL Editor** en Supabase y ejecuta este bloque reemplazando el correo. El bloque también repara automáticamente un perfil faltante.

```sql
do $$
declare
  admin_user_id uuid;
  admin_email text;
  admin_metadata jsonb;
  admin_role_id smallint;
begin
  select id,email,raw_user_meta_data
  into admin_user_id,admin_email,admin_metadata
  from auth.users
  where lower(email)=lower('TU_CORREO@EJEMPLO.COM');

  if admin_user_id is null then
    raise exception 'No existe un usuario con ese correo';
  end if;

  insert into public.profiles(id,email,first_name,last_name,status,verified_at,verified_by)
  values(admin_user_id,admin_email,coalesce(admin_metadata->>'first_name',admin_metadata->>'name',''),coalesce(admin_metadata->>'last_name',''),'active',now(),admin_user_id)
  on conflict(id) do update set status='active',verified_at=coalesce(public.profiles.verified_at,now()),verified_by=admin_user_id,updated_at=now();

  select id into admin_role_id from public.roles where name='admin';
  if admin_role_id is null then raise exception 'No existe el rol admin; ejecuta 001_initial_schema.sql';end if;

  delete from public.user_roles where user_id=admin_user_id;
  insert into public.user_roles(user_id,role_id) values(admin_user_id,admin_role_id);
end $$;
```

Después cierra cualquier sesión, abre `/admin/login` e ingresa. El sistema debe enviarte a `/admin`.

No guardes contraseñas ni la clave `SUPABASE_SERVICE_ROLE_KEY` en SQL o Git.

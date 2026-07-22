create or replace function public.get_my_access_context()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select case
    when auth.uid() is null then null
    else (
      select jsonb_build_object(
        'user_id',p.id,
        'status',p.status,
        'role',coalesce((
          select r.name::text
          from public.user_roles ur
          join public.roles r on r.id=ur.role_id
          where ur.user_id=p.id
          order by case r.name when 'admin' then 1 when 'supervisor' then 2 else 3 end
          limit 1
        ),'customer')
      )
      from public.profiles p
      where p.id=auth.uid()
    )
  end
$$;

revoke all on function public.get_my_access_context() from public,anon;
grant execute on function public.get_my_access_context() to authenticated;
comment on function public.get_my_access_context() is 'Devuelve exclusivamente el estado y rol del usuario autenticado, evitando lecturas directas bloqueadas por RLS.';

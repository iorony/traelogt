alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by uuid references public.profiles(id);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_verified_idx on public.profiles(verified_at) where verified_at is null;
comment on column public.profiles.verified_at is 'Fecha en que un administrador global o supervisor verificó al usuario.';
comment on column public.profiles.verified_by is 'Administrador o supervisor que realizó la verificación.';

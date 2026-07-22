grant select,update on table public.profiles to authenticated;
grant select,insert,update,delete on table public.addresses to authenticated;
notify pgrst,'reload schema';

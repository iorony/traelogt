-- Las instalaciones que ya ejecutaron 024 conservan la función anterior.
-- Supabase instala pgcrypto normalmente en `extensions`, mientras la función
-- de pedidos limita su search_path a `public`. Incluir ese esquema corrige
-- inmediatamente gen_random_bytes sin alterar pedidos ni inventario.
alter function public.create_order_atomic(jsonb,uuid)
  set search_path = public, extensions;

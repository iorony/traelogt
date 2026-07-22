# Configuración manual de Supabase

## 1. Crear el proyecto

1. En Supabase crea un proyecto nuevo en la región más cercana disponible.
2. Conserva la contraseña de base de datos en un gestor de contraseñas.
3. En **Project Settings → API** copia: Project URL, `anon` key y `service_role` key.
4. No compartas ni expongas la clave `service_role` en el navegador.

## 2. Ejecutar las migraciones

En **SQL Editor**, ejecuta en este orden y verifica que cada consulta termine sin errores:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_secure_checkout.sql`
3. `supabase/migrations/003_quote_requests.sql`
4. `supabase/migrations/004_landed_quote_price.sql`
5. `supabase/migrations/005_traelo_brand.sql`
6. `supabase/migrations/006_user_verification.sql`
7. `supabase/migrations/007_backfill_auth_profiles.sql`
8. `supabase/migrations/008_access_context_rpc.sql`
9. `supabase/seed.sql`

La segunda migración crea el checkout transaccional. La tercera agrega solicitudes mediante enlaces. La cuarta establece que `final_price_guatemala` es el precio del producto ya importado y disponible en Guatemala; una entrega local adicional se registra por separado.

## 3. Configurar Authentication

1. En **Authentication → Providers → Email**, habilita Email/Password.
2. Mantén activada la confirmación de correo para producción.
3. En **URL Configuration**, establece Site URL como `http://localhost:3000` durante desarrollo.
4. Agrega `http://localhost:3000/**` a Redirect URLs.
5. Al desplegar, agrega también `https://TU-DOMINIO.vercel.app/**` y cambia Site URL.
6. Personaliza las plantillas de confirmación y recuperación en español.

## 4. Crear Storage

Crea estos buckets:

- `product-images`: público; JPG, PNG y WebP.
- `store-assets`: público; logotipo, favicon y banners.
- `payment-receipts`: privado; JPG, PNG y PDF.

Configura un máximo recomendado de 5 MB por imagen y 10 MB por comprobante. Los comprobantes deben abrirse únicamente mediante URLs firmadas de corta duración generadas en el servidor.

## 5. Variables locales

Copia `.env.example` como `.env.local` y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SERVICE_ROLE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Reinicia el servidor después de cambiar variables.

## 6. Crear el primer administrador

1. Registra la cuenta desde `/registro` y confirma su correo.
2. Abre **Authentication → Users** y copia su UUID.
3. Ejecuta en SQL Editor sustituyendo el UUID:

```sql
insert into public.user_roles(user_id,role_id)
select 'UUID_AQUI',id from public.roles where name='admin'
on conflict do nothing;
```

No edites metadatos del navegador para asignar roles: la autorización se valida contra `user_roles` en el servidor.

## 7. Comprobar la instalación

1. Registra un cliente y verifica que el trigger cree `profiles` y el rol `customer`.
2. Confirma que un visitante puede consultar productos activos, pero no tablas de pedidos.
3. Crea un pedido y comprueba `orders`, `order_items`, `inventory_reservations` y `order_status_history`.
4. Intenta comprar más unidades de las disponibles; debe devolver un error de existencias.
5. Consulta el pedido en `/rastreo` con código y teléfono.

## 8. Configurar Vercel

Agrega las cuatro variables en **Project Settings → Environment Variables** para Production, Preview y Development. Después vuelve a desplegar. Nunca prefijes `SUPABASE_SERVICE_ROLE_KEY` con `NEXT_PUBLIC_`.

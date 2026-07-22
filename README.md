# Tráelo GT — ecommerce y cotizaciones

Plataforma para vender productos disponibles y cotizar compras de Temu, SHEIN, AliExpress y Amazon. El cliente envía el enlace y Tráelo GT responde con el precio final del producto ya importado en Guatemala. Construida con Next.js App Router, TypeScript, Tailwind CSS y Supabase.

## Arquitectura

- `src/app`: rutas públicas, checkout, rastreo y administración.
- `src/components`: componentes interactivos reutilizables.
- `src/lib`: tipos, formato GTQ y clientes Supabase.
- `supabase/migrations`: esquema, índices, triggers y políticas RLS.
- `supabase/seed.sql`: catálogo y configuración de ejemplo; no contiene contraseñas.

El navegador usa la clave anónima. Todas las compras de invitado, totales, cambios de rol, movimientos de inventario y consultas sensibles deben ejecutarse en Route Handlers o Server Actions. La clave `service_role` jamás se importa en componentes cliente.

## Puesta en marcha

Las instrucciones manuales completas están en `docs/CONFIGURACION_SUPABASE.md`.

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` y completa las claves de tu proyecto Supabase.
4. En Supabase SQL Editor ejecuta `supabase/migrations/001_initial_schema.sql` y después `supabase/seed.sql`.
5. Crea los buckets `product-images` (público), `store-assets` (público) y `payment-receipts` (privado). Limita comprobantes a JPG, PNG o PDF y usa URLs firmadas.
6. Ejecuta `npm run dev` y abre `http://localhost:3000`.

## Primer administrador

Consulta `docs/CREAR_ADMIN_GLOBAL.md` para el procedimiento seguro completo.

Registra el usuario normalmente. Desde SQL Editor, usando exclusivamente una sesión de propietario, ejecuta:

```sql
insert into public.user_roles(user_id, role_id)
select 'UUID_DEL_USUARIO', id from public.roles where name = 'admin'
on conflict do nothing;
```

Nunca incluyas contraseñas o la `SUPABASE_SERVICE_ROLE_KEY` en Git.

## Flujo de pedido

`Pendiente → reserva de inventario → confirmación/pago → preparación → empaque → envío → entrega`.

Las transferencias pasan por revisión antes de preparación. Una cancelación libera la reserva. La salida definitiva ocurre al entregar. Cada transición se registra en `order_status_history`; los valores históricos de producto viven en `order_items`.

## Despliegue en Vercel

Importa el repositorio en Vercel, configura las cuatro variables de `.env.example`, selecciona Next.js y despliega. Añade la URL final a las URLs permitidas de Supabase Auth y establece `NEXT_PUBLIC_SITE_URL` con el dominio final.

## Estado de esta entrega

La interfaz y el modelo de datos son funcionales como base de producción. La demostración utiliza un catálogo local para que pueda abrirse sin credenciales. Antes de aceptar ventas reales, conecta los listados a Supabase y completa los Route Handlers transaccionales de checkout, carga privada de comprobantes y administración; el SQL contiene la estrategia de bloqueo y las políticas base.

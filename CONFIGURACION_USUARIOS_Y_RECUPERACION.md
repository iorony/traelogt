# Configuración de usuarios y recuperación

1. Ejecuta `supabase/migrations/009_user_password_management.sql` en el SQL Editor de Supabase.
   Después ejecuta `supabase/migrations/010_catalog_permissions.sql` para habilitar la creación y edición de productos bajo las políticas RLS.
2. En Supabase abre **Authentication > URL Configuration**.
3. Configura **Site URL** con la URL pública del proyecto, por ejemplo `https://tu-dominio.vercel.app`.
4. Agrega a **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `https://tu-dominio.vercel.app/auth/confirm`
5. En Vercel agrega `NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app`.
6. En **Authentication > Email Templates > Reset password** conserva el enlace de recuperación de Supabase (`ConfirmationURL`).

Los clientes también pueden registrarse públicamente en `/registro`; el sistema les asigna automáticamente el rol `customer`. El administrador global crea cuentas desde `/admin/usuarios/nuevo` y es el único que puede asignar roles administrativos. Administradores y supervisores pueden establecer una contraseña fija o marcarla como temporal. La temporal obliga al usuario a cambiarla en el siguiente ingreso.

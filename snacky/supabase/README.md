# Setup de Supabase para Snacky

## Pasos en orden (Dashboard de Supabase)

### 1. Ejecutar SQL

En el **SQL Editor** de tu proyecto Supabase, copiar/pegar y ejecutar **en este orden**:

1. `01_schema.sql` → crea tablas `backgrounds`, `invitations`, `rsvp`, funciones y policies RLS
2. `02_storage.sql` → crea buckets `background-images` y `user-photos`
3. `03_cleanup_cron.sql` → programa el job diario que borra fotos vencidas (3 días post-cumple)
4. `04_seed_backgrounds.sql` → **opcional** — carga los 39 fondos actuales en la tabla. Las imágenes siguen sirviéndose desde `/assets/img/fondos/` hasta que las subas al bucket desde el admin.

### 2. Crear usuario admin

En **Authentication > Users > Add user**:
- Email: el tuyo
- Password: una contraseña fuerte
- Auto Confirm User: ✅ sí (para que puedas loguear sin verificación de mail)

Solo los usuarios autenticados pueden modificar fondos. Para crear un admin nuevo, simplemente repetí este paso.

### 3. Obtener credenciales para el frontend

En **Project Settings > API**:
- `Project URL` → va en `snacky/js/supabase-config.js`
- `anon public` key → va en `snacky/js/supabase-config.js`

⚠️ **NUNCA** copiar la `service_role` key al frontend — esa es la llave maestra del proyecto.

### 4. Verificar el cron

Ejecutar en SQL Editor:
```sql
select jobid, jobname, schedule, active from cron.job;
```

Debería aparecer `cleanup-expired-photos` activo con schedule `0 3 * * *`.

Para probar manualmente la limpieza (sin esperar al cron):
```sql
select public.cleanup_expired_photos();
```

## Estructura de datos

### `backgrounds`
Fondos temáticos gestionados desde el panel admin.

### `invitations`
Cada invitación que un padre genera. Tiene un `slug` corto (ej: `aB3xY9`) que reemplaza el query string gigante de hoy.

`expires_at` = fecha del cumple + 3 días. El cron borra la foto custom cuando vence (la invitación se conserva por si querés métricas).

### `rsvp`
Confirmaciones de asistencia. Hoy se mandan por WhatsApp y se pierden; con esto el padre puede ver lista de confirmados.

## Borrado automático

El cron `cleanup-expired-photos` corre todos los días a las 03:00 UTC. Borra:
- El archivo `.webp` del bucket `user-photos`
- Limpia `custom_photo_url` y `custom_photo_path` de la invitación

La invitación queda en la DB pero ya no tiene foto custom (vuelve a mostrar el fondo temático, si tenía uno).

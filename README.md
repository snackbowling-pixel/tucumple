# Tu Cumple

Generador de invitaciones virtuales para cumpleaños y eventos.

## Estructura

- `/snacky` — Invitaciones para cumpleaños infantiles (Snack Bowling)
- `/ristrel` — Invitaciones para eventos de adultos
- `/assets` — Recursos compartidos (imágenes, etc.)

## Snacky

### Tecnologías
- HTML + JS vanilla
- Supabase (Auth + Storage + Postgres)
- Compresión cliente a WebP

### Setup
1. Crear proyecto Supabase
2. Ejecutar SQL de `snacky/supabase/` en este orden:
   - `01_schema.sql` (o el combinado `00_all_in_one.sql`)
   - `02_storage.sql`
   - `03_cleanup_cron.sql`
   - `04_seed_backgrounds.sql` (opcional)
3. Crear los 2 buckets en Storage UI: `background-images` y `user-photos` (ambos públicos)
4. Crear usuario admin en Authentication > Users (con Auto Confirm)
5. Configurar URL + anon key en `snacky/js/supabase-config.js`
6. (Opcional) Migrar las imágenes legacy desde `/snacky/admin/migrate.html`

### Rutas
- `/snacky/` — Formulario público de creación
- `/snacky/inv.html?id=SLUG` — Invitación generada
- `/snacky/admin/` — Panel admin (login requerido)
- `/snacky/admin/migrate.html` — Migración de imágenes legacy

### Features
- 🎨 Panel admin para gestionar fondos temáticos (categorías, CRUD)
- 📸 Foto personal opcional del cumpleañero (comprime a WebP en el cliente)
- 🗑️ Borrado automático de fotos personales 3 días después del cumple
- 🔗 URLs cortas con slug en lugar de query string gigante
- 💬 Mensaje personalizado del cumpleañero
- 📅 Botón "Agregar a calendario" (Google Calendar)
- 📱 Modal RSVP que arma WhatsApp con datos del invitado
- 📊 Dashboard con métricas (total, semana, vistas, fondos más usados)
- 🎉 Confetti animation

## Ristrel

Por implementar — replicar arquitectura de Snacky para eventos adultos.

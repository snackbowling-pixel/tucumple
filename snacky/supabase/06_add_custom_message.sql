-- Agregar columna opcional 'custom_message' a invitations
-- (mensaje personalizado del cumpleañero, ej: "cumplo 8 y los espero a todos")
alter table public.invitations
add column if not exists custom_message text;

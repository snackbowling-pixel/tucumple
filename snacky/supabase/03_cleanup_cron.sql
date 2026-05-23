-- =====================================================
-- TuCumple - Snacky - Job de limpieza automatica
-- Borra fotos de padres 3 dias despues del cumple
-- Ejecutar DESPUES de 02_storage.sql
-- =====================================================

-- Habilitar extensiones necesarias (free tier las soporta)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- =====================================================
-- FUNCION: borrar fotos vencidas
-- Borra el archivo de storage + el campo custom_photo_* de la invitacion
-- Mantiene la invitacion para historial, solo limpia la foto
-- =====================================================
create or replace function public.cleanup_expired_photos()
returns void
language plpgsql
security definer
as $$
declare
  inv record;
begin
  for inv in
    select id, custom_photo_path
    from public.invitations
    where expires_at < now()
      and custom_photo_path is not null
  loop
    -- borrar archivo de storage
    delete from storage.objects
    where bucket_id = 'user-photos'
      and name = inv.custom_photo_path;

    -- limpiar campos en la invitacion
    update public.invitations
    set custom_photo_path = null,
        custom_photo_url = null
    where id = inv.id;
  end loop;
end;
$$;

-- =====================================================
-- SCHEDULE: correr todos los dias a las 03:00 AM UTC
-- =====================================================
-- Si ya existe el job lo borramos para reprogramarlo
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-expired-photos') then
    perform cron.unschedule('cleanup-expired-photos');
  end if;
end$$;

select cron.schedule(
  'cleanup-expired-photos',
  '0 3 * * *',  -- todos los dias a las 03:00 UTC
  $$select public.cleanup_expired_photos();$$
);

-- =====================================================
-- VERIFICAR: deberia listar el job programado
-- =====================================================
-- select jobid, jobname, schedule, active from cron.job where jobname = 'cleanup-expired-photos';

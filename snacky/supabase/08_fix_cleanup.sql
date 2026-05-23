-- =====================================================
-- Arreglo de cleanup_expired_photos
-- Supabase bloquea el delete directo de storage.objects, asi que
-- esta funcion solo limpia los campos en la DB. El borrado fisico
-- del archivo lo hace el admin al loguearse (usando la Storage API).
-- =====================================================

create or replace function public.cleanup_expired_photos()
returns void
language plpgsql
security definer
as $$
begin
  update public.invitations
  set custom_photo_path = null,
      custom_photo_url  = null
  where expires_at < now()
    and custom_photo_path is not null;
end;
$$;

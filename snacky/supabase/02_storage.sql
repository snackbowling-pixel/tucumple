-- =====================================================
-- TuCumple - Snacky - Storage buckets y policies
-- Ejecutar DESPUES de 01_schema.sql
-- =====================================================

-- Bucket: background-images (fondos tematicos, gestion admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'background-images',
  'background-images',
  true,
  5242880, -- 5MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket: user-photos (fotos subidas por padres, se borran a los 3 dias)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-photos',
  'user-photos',
  true,
  2097152, -- 2MB (ya comprimido a WebP)
  array['image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================
-- POLICIES de storage
-- =====================================================

-- background-images: lectura publica, escritura solo admins
create policy "bg_images_public_read"
  on storage.objects for select
  using (bucket_id = 'background-images');

create policy "bg_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'background-images');

create policy "bg_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'background-images');

create policy "bg_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'background-images');

-- user-photos: lectura publica, escritura anonima permitida (con limite del bucket)
create policy "user_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'user-photos');

create policy "user_photos_public_insert"
  on storage.objects for insert
  with check (bucket_id = 'user-photos');

create policy "user_photos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-photos');

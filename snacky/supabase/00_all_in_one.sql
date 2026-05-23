-- =====================================================
-- TuCumple - Snacky - SETUP COMPLETO EN UN SOLO QUERY
-- =====================================================
-- Pegar TODO este archivo en Supabase Dashboard > SQL Editor
-- y hacer click en "Run". Si todo sale bien no deberia
-- mostrar errores rojos.
-- =====================================================

-- ============ EXTENSIONES ============
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- ============ TABLA: backgrounds ============
create table if not exists public.backgrounds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  image_url text not null,
  storage_path text not null,
  order_index int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_backgrounds_active_order
  on public.backgrounds(active, category, order_index);

-- ============ TABLA: invitations ============
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  child_name text not null,
  birthday date not null,
  start_time time not null,
  phone text not null,
  background_id uuid references public.backgrounds(id) on delete set null,
  custom_photo_url text,
  custom_photo_path text,
  expires_at timestamptz not null,
  views_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_slug on public.invitations(slug);
create index if not exists idx_invitations_expires on public.invitations(expires_at);

-- ============ TABLA: rsvp ============
create table if not exists public.rsvp (
  id uuid primary key default uuid_generate_v4(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null,
  attending boolean not null default true,
  guests_count int not null default 1,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rsvp_invitation on public.rsvp(invitation_id);

-- ============ RLS: backgrounds ============
alter table public.backgrounds enable row level security;
drop policy if exists "backgrounds_public_read" on public.backgrounds;
drop policy if exists "backgrounds_admin_all"   on public.backgrounds;

create policy "backgrounds_public_read" on public.backgrounds
  for select using (active = true);
create policy "backgrounds_admin_all" on public.backgrounds
  for all to authenticated using (true) with check (true);

-- ============ RLS: invitations ============
alter table public.invitations enable row level security;
drop policy if exists "invitations_public_read"   on public.invitations;
drop policy if exists "invitations_public_insert" on public.invitations;
drop policy if exists "invitations_admin_update"  on public.invitations;
drop policy if exists "invitations_admin_delete"  on public.invitations;

create policy "invitations_public_read"   on public.invitations for select using (true);
create policy "invitations_public_insert" on public.invitations for insert with check (true);
create policy "invitations_admin_update"  on public.invitations for update to authenticated using (true);
create policy "invitations_admin_delete"  on public.invitations for delete to authenticated using (true);

-- ============ RLS: rsvp ============
alter table public.rsvp enable row level security;
drop policy if exists "rsvp_public_insert" on public.rsvp;
drop policy if exists "rsvp_owner_read"    on public.rsvp;

create policy "rsvp_public_insert" on public.rsvp for insert with check (true);
create policy "rsvp_owner_read"    on public.rsvp for select using (true);

-- ============ FUNCIONES ============
create or replace function public.generate_invitation_slug()
returns text language plpgsql as $$
declare
  alphabet text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int := 0;
  attempt int := 0;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * 62)::int, 1);
    end loop;
    if not exists (select 1 from public.invitations where slug = result) then
      return result;
    end if;
    attempt := attempt + 1;
    if attempt > 10 then
      result := result || substr(alphabet, 1 + floor(random() * 62)::int, 1)
                      || substr(alphabet, 1 + floor(random() * 62)::int, 1);
      return result;
    end if;
  end loop;
end;
$$;

create or replace function public.increment_invitation_views(p_slug text)
returns void language plpgsql security definer as $$
begin
  update public.invitations
  set views_count = views_count + 1
  where slug = p_slug;
end;
$$;

grant execute on function public.increment_invitation_views(text) to anon, authenticated;
grant execute on function public.generate_invitation_slug() to anon, authenticated;

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('background-images', 'background-images', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-photos', 'user-photos', true, 2097152, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============ STORAGE POLICIES ============
drop policy if exists "bg_images_public_read"     on storage.objects;
drop policy if exists "bg_images_admin_insert"    on storage.objects;
drop policy if exists "bg_images_admin_update"    on storage.objects;
drop policy if exists "bg_images_admin_delete"    on storage.objects;
drop policy if exists "user_photos_public_read"   on storage.objects;
drop policy if exists "user_photos_public_insert" on storage.objects;
drop policy if exists "user_photos_admin_delete"  on storage.objects;

create policy "bg_images_public_read" on storage.objects
  for select using (bucket_id = 'background-images');
create policy "bg_images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'background-images');
create policy "bg_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'background-images');
create policy "bg_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'background-images');

create policy "user_photos_public_read" on storage.objects
  for select using (bucket_id = 'user-photos');
create policy "user_photos_public_insert" on storage.objects
  for insert with check (bucket_id = 'user-photos');
create policy "user_photos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'user-photos');

-- ============ CRON: borrar fotos vencidas ============
create or replace function public.cleanup_expired_photos()
returns void language plpgsql security definer as $$
declare inv record;
begin
  for inv in
    select id, custom_photo_path from public.invitations
    where expires_at < now() and custom_photo_path is not null
  loop
    delete from storage.objects
    where bucket_id = 'user-photos' and name = inv.custom_photo_path;
    update public.invitations
    set custom_photo_path = null, custom_photo_url = null
    where id = inv.id;
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-expired-photos') then
    perform cron.unschedule('cleanup-expired-photos');
  end if;
end$$;

select cron.schedule(
  'cleanup-expired-photos',
  '0 3 * * *',
  $$select public.cleanup_expired_photos();$$
);

-- ============ SEED: fondos existentes ============
insert into public.backgrounds (name, category, image_url, storage_path, order_index) values
  ('Avengers',             'Marvel',     '/assets/img/fondos/fondo2.jpg',  'legacy/fondo2.jpg',  1),
  ('Spiderman',            'Marvel',     '/assets/img/fondos/fondo11.jpg', 'legacy/fondo11.jpg', 2),
  ('Iron Man',             'Marvel',     '/assets/img/fondos/fondo12.jpg', 'legacy/fondo12.jpg', 3),
  ('Avengers Ultron',      'Marvel',     '/assets/img/fondos/fondo13.jpg', 'legacy/fondo13.jpg', 4),
  ('Mundo DC',             'DC',         '/assets/img/fondos/fondo17.jpg', 'legacy/fondo17.jpg', 1),
  ('Batman',               'DC',         '/assets/img/fondos/fondo14.jpg', 'legacy/fondo14.jpg', 2),
  ('Flash',                'DC',         '/assets/img/fondos/fondo15.jpg', 'legacy/fondo15.jpg', 3),
  ('Liga de la Justicia',  'DC',         '/assets/img/fondos/fondo16.jpg', 'legacy/fondo16.jpg', 4),
  ('X-Men',                'DC',         '/assets/img/fondos/fondo31.jpg', 'legacy/fondo31.jpg', 5),
  ('Wish',                 'Disney',     '/assets/img/fondos/fondo8.jpg',  'legacy/fondo8.jpg',  1),
  ('Frozen',               'Disney',     '/assets/img/fondos/fondo7.jpg',  'legacy/fondo7.jpg',  2),
  ('Minnie Mouse',         'Disney',     '/assets/img/fondos/fondo19.jpg', 'legacy/fondo19.jpg', 3),
  ('Princesas',            'Disney',     '/assets/img/fondos/fondo20.jpg', 'legacy/fondo20.jpg', 4),
  ('Cars',                 'Disney',     '/assets/img/fondos/fondo30.jpg', 'legacy/fondo30.jpg', 5),
  ('Stitch',               'Disney',     '/assets/img/fondos/fondo32.jpg', 'legacy/fondo32.jpg', 6),
  ('Colapinto',            'Formula 1',  '/assets/img/fondos/fondo34.jpg', 'legacy/fondo34.jpg', 1),
  ('Verstappen',           'Formula 1',  '/assets/img/fondos/fondo35.jpg', 'legacy/fondo35.jpg', 2),
  ('Ferrari',              'Formula 1',  '/assets/img/fondos/fondo36.jpg', 'legacy/fondo36.jpg', 3),
  ('Hamilton',             'Formula 1',  '/assets/img/fondos/fondo76.jpg', 'legacy/fondo76.jpg', 4),
  ('Seleccion Argentina',  'Futbol',     '/assets/img/fondos/fondo1.jpg',  'legacy/fondo1.jpg',  1),
  ('River Plate',          'Futbol',     '/assets/img/fondos/fondo22.jpg', 'legacy/fondo22.jpg', 2),
  ('Boca Juniors',         'Futbol',     '/assets/img/fondos/fondo23.jpg', 'legacy/fondo23.jpg', 3),
  ('Racing Club',          'Futbol',     '/assets/img/fondos/fondo24.jpg', 'legacy/fondo24.jpg', 4),
  ('Velez',                'Futbol',     '/assets/img/fondos/fondo25.jpg', 'legacy/fondo25.jpg', 5),
  ('San Lorenzo',          'Futbol',     '/assets/img/fondos/fondo26.jpg', 'legacy/fondo26.jpg', 6),
  ('Independiente',        'Futbol',     '/assets/img/fondos/fondo27.jpg', 'legacy/fondo27.jpg', 7),
  ('Bowling',              'Otros',      '/assets/img/fondos/fondo3.jpg',  'legacy/fondo3.jpg',  1),
  ('Snack Kids',           'Otros',      '/assets/img/fondos/fondo37.jpg', 'legacy/fondo37.jpg', 2),
  ('Bowling II',           'Otros',      '/assets/img/fondos/fondo38.jpg', 'legacy/fondo38.jpg', 3),
  ('Stumble Guys',         'Otros',      '/assets/img/fondos/fondo69.jpg', 'legacy/fondo69.jpg', 4),
  ('LEGO',                 'Otros',      '/assets/img/fondos/fondo29.jpg', 'legacy/fondo29.jpg', 5),
  ('La vaca Lola',         'Otros',      '/assets/img/fondos/fondo88.jpg', 'legacy/fondo88.jpg', 6),
  ('Pikachu',              'Otros',      '/assets/img/fondos/fondo21.jpg', 'legacy/fondo21.jpg', 7),
  ('Harry Potter',         'Otros',      '/assets/img/fondos/fondo4.jpg',  'legacy/fondo4.jpg',  8),
  ('Dinosaurios',          'Otros',      '/assets/img/fondos/fondo5.jpg',  'legacy/fondo5.jpg',  9),
  ('Star Wars',            'Otros',      '/assets/img/fondos/fondo6.jpg',  'legacy/fondo6.jpg',  10),
  ('Fortnite',             'Otros',      '/assets/img/fondos/fondo18.jpg', 'legacy/fondo18.jpg', 11),
  ('Hello Kitty',          'Otros',      '/assets/img/fondos/fondo9.jpg',  'legacy/fondo9.jpg',  12),
  ('Minions',              'Otros',      '/assets/img/fondos/fondo28.jpg', 'legacy/fondo28.jpg', 13),
  ('Minecraft',            'Otros',      '/assets/img/fondos/fondo10.jpg', 'legacy/fondo10.jpg', 14)
on conflict do nothing;

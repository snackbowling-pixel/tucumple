-- =====================================================
-- SETUP SEGURO (sin pg_cron) - corre en cualquier proyecto
-- Pegar todo en SQL Editor y Run
-- =====================================================

create extension if not exists "uuid-ossp";

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

-- ============ RLS ============
alter table public.backgrounds enable row level security;
drop policy if exists "backgrounds_public_read" on public.backgrounds;
drop policy if exists "backgrounds_admin_all"   on public.backgrounds;
create policy "backgrounds_public_read" on public.backgrounds
  for select using (active = true);
create policy "backgrounds_admin_all" on public.backgrounds
  for all to authenticated using (true) with check (true);

alter table public.invitations enable row level security;
drop policy if exists "invitations_public_read"   on public.invitations;
drop policy if exists "invitations_public_insert" on public.invitations;
create policy "invitations_public_read"   on public.invitations for select using (true);
create policy "invitations_public_insert" on public.invitations for insert with check (true);

alter table public.rsvp enable row level security;
drop policy if exists "rsvp_public_insert" on public.rsvp;
drop policy if exists "rsvp_owner_read"    on public.rsvp;
create policy "rsvp_public_insert" on public.rsvp for insert with check (true);
create policy "rsvp_owner_read"    on public.rsvp for select using (true);

-- ============ STORAGE POLICIES (los buckets ya los creaste por UI) ============
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
      return result || substr(alphabet, 1 + floor(random() * 62)::int, 1)
                    || substr(alphabet, 1 + floor(random() * 62)::int, 1);
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

-- ============ FUNCION DE LIMPIEZA (la activamos despues con cron) ============
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

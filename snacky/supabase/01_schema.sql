-- =====================================================
-- TuCumple - Snacky - Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- Extension necesaria para uuid
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLA: backgrounds (fondos tematicos gestionados por admin)
-- =====================================================
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

-- =====================================================
-- TABLA: invitations (cada invitacion generada)
-- =====================================================
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

-- =====================================================
-- TABLA: rsvp (confirmaciones de asistencia)
-- =====================================================
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

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- backgrounds: lectura publica de activos; escritura solo autenticados (admin)
alter table public.backgrounds enable row level security;

create policy "backgrounds_public_read"
  on public.backgrounds for select
  using (active = true);

create policy "backgrounds_admin_all"
  on public.backgrounds for all
  to authenticated
  using (true)
  with check (true);

-- invitations: anon puede crear y leer por slug; nadie borra/edita desde cliente
alter table public.invitations enable row level security;

create policy "invitations_public_read"
  on public.invitations for select
  using (true);

create policy "invitations_public_insert"
  on public.invitations for insert
  with check (true);

create policy "invitations_admin_update"
  on public.invitations for update
  to authenticated
  using (true);

create policy "invitations_admin_delete"
  on public.invitations for delete
  to authenticated
  using (true);

-- rsvp: anon puede insertar; admin puede leer todas
alter table public.rsvp enable row level security;

create policy "rsvp_public_insert"
  on public.rsvp for insert
  with check (true);

create policy "rsvp_owner_read"
  on public.rsvp for select
  using (true);

-- =====================================================
-- FUNCIONES UTILITARIAS
-- =====================================================

-- Generar slug corto unico para invitaciones (6 chars base62)
create or replace function public.generate_invitation_slug()
returns text
language plpgsql
as $$
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

    -- verificar unicidad
    if not exists (select 1 from public.invitations where slug = result) then
      return result;
    end if;

    attempt := attempt + 1;
    if attempt > 10 then
      -- fallback: usar 8 chars
      result := result || substr(alphabet, 1 + floor(random() * 62)::int, 1)
                      || substr(alphabet, 1 + floor(random() * 62)::int, 1);
      return result;
    end if;
  end loop;
end;
$$;

-- Incrementar contador de vistas de invitacion (RPC publica)
create or replace function public.increment_invitation_views(p_slug text)
returns void
language plpgsql
security definer
as $$
begin
  update public.invitations
  set views_count = views_count + 1
  where slug = p_slug;
end;
$$;

grant execute on function public.increment_invitation_views(text) to anon, authenticated;
grant execute on function public.generate_invitation_slug() to anon, authenticated;

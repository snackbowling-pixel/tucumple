-- =====================================================
-- Tabla de subscribers (marketing opt-in)
-- =====================================================

create table if not exists public.subscribers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  source text default 'snacky-form',
  invitation_id uuid references public.invitations(id) on delete set null,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- Indice único case-insensitive para evitar duplicados de email
create unique index if not exists subscribers_email_unique
  on public.subscribers(lower(email));

-- RLS: cualquiera puede subscribirse, solo admin puede leer
alter table public.subscribers enable row level security;

drop policy if exists "subscribers_public_insert" on public.subscribers;
drop policy if exists "subscribers_admin_read"    on public.subscribers;

create policy "subscribers_public_insert"
  on public.subscribers for insert
  with check (true);

create policy "subscribers_admin_read"
  on public.subscribers for select
  to authenticated
  using (true);

create policy "subscribers_admin_update"
  on public.subscribers for update
  to authenticated
  using (true);

-- Marketing websites (public mini-sites) with portfolio + email signup.
-- These are public read endpoints served via our API (service role),
-- but the source tables remain protected by RLS for owner access in-app.

create extension if not exists pgcrypto;

create table if not exists public.marketing_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  slug text not null,
  name text not null default '',
  template text not null default 'studio', -- studio | minimal | bold
  headline text not null default '',
  subheadline text not null default '',
  cta_text text not null default 'Get updates',
  logo_url text null,
  show_email_signup boolean not null default true,
  show_portfolio boolean not null default true,
  primary_color text not null default '#6366F1',
  accent_color text not null default '#22C55E',
  background_style text not null default 'aurora', -- aurora | grid | plain
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_sites_slug_unique'
  ) then
    alter table public.marketing_sites
      add constraint marketing_sites_slug_unique unique (slug);
  end if;
end $$;

create index if not exists idx_marketing_sites_user_id on public.marketing_sites(user_id);
create index if not exists idx_marketing_sites_slug on public.marketing_sites(slug);
create index if not exists idx_marketing_sites_published_at on public.marketing_sites(published_at);

create table if not exists public.marketing_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  site_id uuid not null references public.marketing_sites(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  url text null,
  tags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_portfolio_items_user_id on public.marketing_portfolio_items(user_id);
create index if not exists idx_marketing_portfolio_items_site_id on public.marketing_portfolio_items(site_id);

-- Signup log for attribution + rate limiting (readable by owner only).
create table if not exists public.marketing_site_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  site_id uuid not null references public.marketing_sites(id) on delete cascade,
  email text not null,
  name text null,
  consent boolean not null default true,
  created_at timestamptz not null default now(),
  ip text null,
  user_agent text null
);

create index if not exists idx_marketing_site_signups_user_id on public.marketing_site_signups(user_id);
create index if not exists idx_marketing_site_signups_site_id on public.marketing_site_signups(site_id);
create index if not exists idx_marketing_site_signups_created_at on public.marketing_site_signups(created_at);

alter table public.marketing_sites enable row level security;
alter table public.marketing_portfolio_items enable row level security;
alter table public.marketing_site_signups enable row level security;

drop policy if exists "Marketing sites SELECT own" on public.marketing_sites;
create policy "Marketing sites SELECT own"
  on public.marketing_sites
  for select
  using (auth.uid() = user_id);

drop policy if exists "Marketing sites INSERT own" on public.marketing_sites;
create policy "Marketing sites INSERT own"
  on public.marketing_sites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Marketing sites UPDATE own" on public.marketing_sites;
create policy "Marketing sites UPDATE own"
  on public.marketing_sites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Marketing sites DELETE own" on public.marketing_sites;
create policy "Marketing sites DELETE own"
  on public.marketing_sites
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Marketing portfolio SELECT own" on public.marketing_portfolio_items;
create policy "Marketing portfolio SELECT own"
  on public.marketing_portfolio_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Marketing portfolio INSERT own" on public.marketing_portfolio_items;
create policy "Marketing portfolio INSERT own"
  on public.marketing_portfolio_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Marketing portfolio UPDATE own" on public.marketing_portfolio_items;
create policy "Marketing portfolio UPDATE own"
  on public.marketing_portfolio_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Marketing portfolio DELETE own" on public.marketing_portfolio_items;
create policy "Marketing portfolio DELETE own"
  on public.marketing_portfolio_items
  for delete
  using (auth.uid() = user_id);

-- Signups are visible to owner, inserts are done via service role in public endpoint.
drop policy if exists "Marketing site signups SELECT own" on public.marketing_site_signups;
create policy "Marketing site signups SELECT own"
  on public.marketing_site_signups
  for select
  using (auth.uid() = user_id);

-- Ensure updated_at stays current (function also used by other migrations).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_sites_updated_at on public.marketing_sites;
create trigger trg_marketing_sites_updated_at
before update on public.marketing_sites
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_marketing_portfolio_items_updated_at on public.marketing_portfolio_items;
create trigger trg_marketing_portfolio_items_updated_at
before update on public.marketing_portfolio_items
for each row execute procedure public.set_updated_at();

notify pgrst, 'reload schema';


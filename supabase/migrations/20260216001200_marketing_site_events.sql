-- Website analytics events for marketing mini-sites.
-- Public endpoints insert rows using service role key; owners read via RLS.

create extension if not exists pgcrypto;

create table if not exists public.marketing_site_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  site_id uuid not null references public.marketing_sites(id) on delete cascade,
  event_type text not null, -- page_view | session_start | link_click | signup
  session_id text null,
  anon_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_site_events_user_id on public.marketing_site_events(user_id);
create index if not exists idx_marketing_site_events_site_id on public.marketing_site_events(site_id);
create index if not exists idx_marketing_site_events_type on public.marketing_site_events(event_type);
create index if not exists idx_marketing_site_events_created_at on public.marketing_site_events(created_at);
create index if not exists idx_marketing_site_events_site_created on public.marketing_site_events(site_id, created_at desc);

alter table public.marketing_site_events enable row level security;

drop policy if exists "Marketing site events SELECT own" on public.marketing_site_events;
create policy "Marketing site events SELECT own"
  on public.marketing_site_events
  for select
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';


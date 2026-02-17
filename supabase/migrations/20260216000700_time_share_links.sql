-- Shareable time report links (read-only, token-based access).
-- Used to share a time report with a client without requiring login.

create extension if not exists pgcrypto;

create table if not exists public.time_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  label text not null default '',
  from_time timestamptz null,
  to_time timestamptz null,
  include_details boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  expires_at timestamptz null
);

-- Token is used as the lookup key from the public report endpoint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_share_links_token_unique'
  ) then
    alter table public.time_share_links
      add constraint time_share_links_token_unique unique (token);
  end if;
end $$;

create index if not exists idx_time_share_links_user_id on public.time_share_links(user_id);
create index if not exists idx_time_share_links_token on public.time_share_links(token);
create index if not exists idx_time_share_links_revoked_at on public.time_share_links(revoked_at);

alter table public.time_share_links enable row level security;

drop policy if exists "Time share links SELECT own" on public.time_share_links;
create policy "Time share links SELECT own"
  on public.time_share_links
  for select
  using (auth.uid() = user_id);

drop policy if exists "Time share links INSERT own" on public.time_share_links;
create policy "Time share links INSERT own"
  on public.time_share_links
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Time share links UPDATE own" on public.time_share_links;
create policy "Time share links UPDATE own"
  on public.time_share_links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Time share links DELETE own" on public.time_share_links;
create policy "Time share links DELETE own"
  on public.time_share_links
  for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';


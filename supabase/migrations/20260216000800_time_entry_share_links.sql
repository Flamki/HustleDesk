-- Shareable single time-entry links (read-only, token-based access).
-- Used to share one specific session from the time tracker with a client.

create extension if not exists pgcrypto;

create table if not exists public.time_entry_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  token text not null,
  include_details boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  expires_at timestamptz null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_entry_share_links_token_unique'
  ) then
    alter table public.time_entry_share_links
      add constraint time_entry_share_links_token_unique unique (token);
  end if;
end $$;

create index if not exists idx_time_entry_share_links_user_id on public.time_entry_share_links(user_id);
create index if not exists idx_time_entry_share_links_time_entry_id on public.time_entry_share_links(time_entry_id);
create index if not exists idx_time_entry_share_links_token on public.time_entry_share_links(token);
create index if not exists idx_time_entry_share_links_revoked_at on public.time_entry_share_links(revoked_at);

alter table public.time_entry_share_links enable row level security;

drop policy if exists "Time entry share links SELECT own" on public.time_entry_share_links;
create policy "Time entry share links SELECT own"
  on public.time_entry_share_links
  for select
  using (auth.uid() = user_id);

drop policy if exists "Time entry share links INSERT own" on public.time_entry_share_links;
create policy "Time entry share links INSERT own"
  on public.time_entry_share_links
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Time entry share links UPDATE own" on public.time_entry_share_links;
create policy "Time entry share links UPDATE own"
  on public.time_entry_share_links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Time entry share links DELETE own" on public.time_entry_share_links;
create policy "Time entry share links DELETE own"
  on public.time_entry_share_links
  for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';


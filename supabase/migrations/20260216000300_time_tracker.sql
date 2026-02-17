-- Feature: Full time tracker for hourly freelancers

create extension if not exists pgcrypto;

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  client varchar(255) not null,
  project varchar(255) not null,
  description text not null default '',
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  hourly_rate decimal(10, 2) not null default 0 check (hourly_rate >= 0),
  currency varchar(10) not null default 'USD',
  earnings decimal(10, 2) not null default 0 check (earnings >= 0),
  created_at timestamptz not null default now(),
  constraint time_entries_end_after_start check (end_time >= start_time)
);

alter table public.time_entries enable row level security;

drop policy if exists "Time entries SELECT own" on public.time_entries;
create policy "Time entries SELECT own"
  on public.time_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists "Time entries INSERT own" on public.time_entries;
create policy "Time entries INSERT own"
  on public.time_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Time entries UPDATE own" on public.time_entries;
create policy "Time entries UPDATE own"
  on public.time_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Time entries DELETE own" on public.time_entries;
create policy "Time entries DELETE own"
  on public.time_entries
  for delete
  using (auth.uid() = user_id);

drop index if exists idx_time_entries_user_id;
create index idx_time_entries_user_id on public.time_entries(user_id);

drop index if exists idx_time_entries_start_time;
create index idx_time_entries_start_time on public.time_entries(start_time desc);

drop index if exists idx_time_entries_job_id;
create index idx_time_entries_job_id on public.time_entries(job_id);

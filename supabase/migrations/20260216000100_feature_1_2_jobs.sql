-- Feature 1.2: Basic Job Management

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_platform') then
    create type public.job_platform as enum ('upwork', 'fiverr', 'linkedin', 'other');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('saved', 'applied', 'replied', 'won', 'lost');
  end if;
end
$$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(500) not null,
  platform public.job_platform not null,
  company varchar(255),
  job_description text not null,
  budget_min decimal(10, 2),
  budget_max decimal(10, 2),
  currency varchar(10) not null default 'INR',
  proposed_price decimal(10, 2),
  notes text,
  proposal text,
  status public.job_status not null default 'saved',
  followup_date date,
  applied_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint jobs_budget_range_valid check (
    budget_min is null
    or budget_max is null
    or budget_max >= budget_min
  )
);

alter table public.jobs enable row level security;

drop policy if exists "Jobs SELECT own" on public.jobs;
create policy "Jobs SELECT own"
  on public.jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Jobs INSERT own" on public.jobs;
create policy "Jobs INSERT own"
  on public.jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Jobs UPDATE own" on public.jobs;
create policy "Jobs UPDATE own"
  on public.jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Jobs DELETE own" on public.jobs;
create policy "Jobs DELETE own"
  on public.jobs
  for delete
  using (auth.uid() = user_id);

drop index if exists idx_jobs_user_id;
create index idx_jobs_user_id on public.jobs(user_id);

drop index if exists idx_jobs_status;
create index idx_jobs_status on public.jobs(status);

drop index if exists idx_jobs_followup_date;
create index idx_jobs_followup_date on public.jobs(followup_date);

create or replace function public.handle_job_status_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'applied' and (tg_op = 'INSERT' or old.status is distinct from 'applied') then
    if new.applied_at is null then
      new.applied_at = now();
    end if;
    new.followup_date = (new.applied_at::date + interval '3 days')::date;
  end if;

  if new.status in ('won', 'lost') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if new.closed_at is null then
      new.closed_at = now();
    end if;
  end if;

  if new.status not in ('won', 'lost') then
    new.closed_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jobs_status_fields on public.jobs;
create trigger trg_jobs_status_fields
  before insert or update on public.jobs
  for each row execute procedure public.handle_job_status_fields();

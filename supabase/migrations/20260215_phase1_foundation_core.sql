-- Phase 1: Foundation & Core Infrastructure
-- Users table, RLS policies, indexes, and auto-profile trigger.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(255) unique not null,
  plan varchar(20) not null default 'free',
  ai_credits_used integer not null default 0,
  ai_credits_limit integer not null default 5,
  skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users SELECT own profile" on public.users;
create policy "Users SELECT own profile"
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists "Users UPDATE own profile" on public.users;
create policy "Users UPDATE own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop index if exists idx_users_email;
create index idx_users_email on public.users (email);

drop index if exists idx_users_plan;
create index idx_users_plan on public.users (plan);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, plan, ai_credits_used, ai_credits_limit, skills)
  values (
    new.id,
    new.email,
    'free',
    0,
    5,
    '{}'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

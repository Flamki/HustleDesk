-- Feature: Marketing updates email subscriptions

create extension if not exists pgcrypto;

create table if not exists public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  source varchar(100) not null default 'updates_page',
  status varchar(20) not null default 'active',
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.email_subscriptions enable row level security;

-- Keep table private; writes happen through server endpoint using service role.
drop policy if exists "No direct select email_subscriptions" on public.email_subscriptions;
create policy "No direct select email_subscriptions"
  on public.email_subscriptions
  for select
  using (false);

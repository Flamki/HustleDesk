-- Persist freelancer profile (used by profile context / proposal personalization)

create table if not exists public.freelancer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  skills text[] not null default '{}'::text[],
  experience_level text not null default 'Entry',
  years_experience integer not null default 0,
  bio text not null default '',
  portfolio_url text null,
  linkedin_url text null,
  hourly_rate numeric(10,2) not null default 0,
  past_projects jsonb not null default '[]'::jsonb,
  communication_style text not null default 'Professional',
  completed_onboarding boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.freelancer_profiles enable row level security;

drop policy if exists "Freelancer profiles SELECT own" on public.freelancer_profiles;
create policy "Freelancer profiles SELECT own"
  on public.freelancer_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Freelancer profiles INSERT own" on public.freelancer_profiles;
create policy "Freelancer profiles INSERT own"
  on public.freelancer_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Freelancer profiles UPDATE own" on public.freelancer_profiles;
create policy "Freelancer profiles UPDATE own"
  on public.freelancer_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_freelancer_profiles_user_id on public.freelancer_profiles (user_id);

notify pgrst, 'reload schema';


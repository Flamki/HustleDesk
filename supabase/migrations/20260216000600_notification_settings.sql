-- Notification settings per user (UI toggles persistence)

create table if not exists public.notification_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  followup_reminders boolean not null default true,
  client_replies boolean not null default true,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "Notification settings SELECT own" on public.notification_settings;
create policy "Notification settings SELECT own"
  on public.notification_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Notification settings INSERT own" on public.notification_settings;
create policy "Notification settings INSERT own"
  on public.notification_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Notification settings UPDATE own" on public.notification_settings;
create policy "Notification settings UPDATE own"
  on public.notification_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_notification_settings_user_id on public.notification_settings (user_id);

notify pgrst, 'reload schema';


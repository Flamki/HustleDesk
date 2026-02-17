-- Client segmentation settings (user-configurable scoring weights)

create table if not exists public.client_segmentation_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  weights jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.client_segmentation_settings enable row level security;

drop policy if exists "Client segmentation settings SELECT own" on public.client_segmentation_settings;
create policy "Client segmentation settings SELECT own"
  on public.client_segmentation_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Client segmentation settings INSERT own" on public.client_segmentation_settings;
create policy "Client segmentation settings INSERT own"
  on public.client_segmentation_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Client segmentation settings UPDATE own" on public.client_segmentation_settings;
create policy "Client segmentation settings UPDATE own"
  on public.client_segmentation_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

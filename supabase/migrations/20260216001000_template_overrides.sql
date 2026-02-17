-- User template overrides (personalized edits) while base templates remain versioned in code.
-- Safe to run multiple times.

create table if not exists public.template_overrides (
  user_id uuid not null references public.users(id) on delete cascade,
  template_key text not null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, template_key)
);

create index if not exists idx_template_overrides_user_id on public.template_overrides (user_id);
create index if not exists idx_template_overrides_template_key on public.template_overrides (template_key);

alter table public.template_overrides enable row level security;

drop policy if exists "Template overrides SELECT own" on public.template_overrides;
create policy "Template overrides SELECT own"
  on public.template_overrides
  for select
  using (auth.uid() = user_id);

drop policy if exists "Template overrides INSERT own" on public.template_overrides;
create policy "Template overrides INSERT own"
  on public.template_overrides
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Template overrides UPDATE own" on public.template_overrides;
create policy "Template overrides UPDATE own"
  on public.template_overrides
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Template overrides DELETE own" on public.template_overrides;
create policy "Template overrides DELETE own"
  on public.template_overrides
  for delete
  using (auth.uid() = user_id);

-- Ensure updated_at stays current (function also used by marketing tables).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_template_overrides_updated_at on public.template_overrides;
create trigger trg_template_overrides_updated_at
before update on public.template_overrides
for each row execute procedure public.set_updated_at();

notify pgrst, 'reload schema';


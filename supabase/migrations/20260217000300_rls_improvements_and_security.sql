-- RLS Policy Improvements and Security Enhancements
-- Fixes security gaps and enables service role operations
-- Migration created: 2026-02-17

-- Fix: Allow service role to insert marketing site signups (public form submissions)
drop policy if exists "Marketing site signups INSERT service" on public.marketing_site_signups;
create policy "Marketing site signups INSERT service"
  on public.marketing_site_signups
  for insert
  with check (true); -- Service role bypasses RLS, but policy must exist

-- Fix: Allow service role to insert marketing site events (public analytics)
drop policy if exists "Marketing site events INSERT service" on public.marketing_site_events;
create policy "Marketing site events INSERT service"
  on public.marketing_site_events
  for insert
  with check (true); -- Service role bypasses RLS, but policy must exist

-- Improvement: Add expiry validation to time share links
-- Update existing policy to check expiry date
drop policy if exists "Time share links public read" on public.time_share_links;
create policy "Time share links public read"
  on public.time_share_links
  for select
  using (
    revoked_at is null
    and (expires_at is null or expires_at > now())
  );

-- Improvement: Add expiry validation to time entry share links
drop policy if exists "Time entry share links public read" on public.time_entry_share_links;
create policy "Time entry share links public read"
  on public.time_entry_share_links
  for select
  using (
    expires_at is null or expires_at > now()
  );

-- Add soft delete support: Add deleted_at columns to major tables
-- This enables "undo" functionality and audit compliance

alter table public.jobs
  add column if not exists deleted_at timestamptz;

alter table public.time_entries
  add column if not exists deleted_at timestamptz;

alter table public.marketing_campaigns
  add column if not exists deleted_at timestamptz;

alter table public.marketing_contacts
  add column if not exists deleted_at timestamptz;

alter table public.marketing_sites
  add column if not exists deleted_at timestamptz;

-- Update RLS policies to exclude soft-deleted records

-- Jobs: Update SELECT policy to exclude deleted
drop policy if exists "Jobs SELECT own" on public.jobs;
create policy "Jobs SELECT own"
  on public.jobs
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- Jobs: Allow viewing deleted records separately (for recovery UI)
drop policy if exists "Jobs SELECT own deleted" on public.jobs;
create policy "Jobs SELECT own deleted"
  on public.jobs
  for select
  using (auth.uid() = user_id and deleted_at is not null);

-- Time entries: Update SELECT policy to exclude deleted
drop policy if exists "Time entries SELECT own" on public.time_entries;
create policy "Time entries SELECT own"
  on public.time_entries
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- Marketing campaigns: Update SELECT policy to exclude deleted
drop policy if exists "Marketing campaigns SELECT own" on public.marketing_campaigns;
create policy "Marketing campaigns SELECT own"
  on public.marketing_campaigns
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- Marketing contacts: Update SELECT policy to exclude deleted
drop policy if exists "Marketing contacts SELECT own" on public.marketing_contacts;
create policy "Marketing contacts SELECT own"
  on public.marketing_contacts
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- Marketing sites: Update SELECT policy to exclude deleted
drop policy if exists "Marketing sites SELECT own" on public.marketing_sites;
create policy "Marketing sites SELECT own"
  on public.marketing_sites
  for select
  using (auth.uid() = user_id and deleted_at is null);

-- Add indexes for soft delete queries
create index if not exists idx_jobs_deleted_at 
  on public.jobs(deleted_at) where deleted_at is not null;

create index if not exists idx_time_entries_deleted_at 
  on public.time_entries(deleted_at) where deleted_at is not null;

create index if not exists idx_marketing_campaigns_deleted_at 
  on public.marketing_campaigns(deleted_at) where deleted_at is not null;

create index if not exists idx_marketing_contacts_deleted_at 
  on public.marketing_contacts(deleted_at) where deleted_at is not null;

create index if not exists idx_marketing_sites_deleted_at 
  on public.marketing_sites(deleted_at) where deleted_at is not null;

-- Function to soft delete a record (set deleted_at)
create or replace function public.soft_delete_record(
  p_table_name text,
  p_record_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_query text;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Validate table name (prevent SQL injection)
  if p_table_name not in ('jobs', 'time_entries', 'marketing_campaigns', 'marketing_contacts', 'marketing_sites') then
    raise exception 'Invalid table name';
  end if;
  
  -- Build and execute soft delete query
  v_query := format(
    'update public.%I set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null',
    p_table_name
  );
  
  execute v_query using p_record_id, v_user_id;
  
  return found;
end;
$$;

-- Function to restore a soft-deleted record
create or replace function public.restore_record(
  p_table_name text,
  p_record_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_query text;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Validate table name (prevent SQL injection)
  if p_table_name not in ('jobs', 'time_entries', 'marketing_campaigns', 'marketing_contacts', 'marketing_sites') then
    raise exception 'Invalid table name';
  end if;
  
  -- Build and execute restore query
  v_query := format(
    'update public.%I set deleted_at = null where id = $1 and user_id = $2 and deleted_at is not null',
    p_table_name
  );
  
  execute v_query using p_record_id, v_user_id;
  
  return found;
end;
$$;

-- Function to permanently delete old soft-deleted records (run periodically)
create or replace function public.purge_old_deleted_records(
  p_table_name text,
  p_days_old integer default 90
)
returns integer
language plpgsql
security definer
as $$
declare
  v_query text;
  v_deleted_count integer;
begin
  -- Validate table name (prevent SQL injection)
  if p_table_name not in ('jobs', 'time_entries', 'marketing_campaigns', 'marketing_contacts', 'marketing_sites') then
    raise exception 'Invalid table name';
  end if;
  
  -- Build and execute purge query
  v_query := format(
    'delete from public.%I where deleted_at is not null and deleted_at < now() - interval ''%s days''',
    p_table_name,
    p_days_old
  );
  
  execute v_query;
  get diagnostics v_deleted_count = row_count;
  
  return v_deleted_count;
end;
$$;

-- Create ENUM for rate limit tiers (needed before adding column)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rate_limit_tier_enum') then
    create type public.rate_limit_tier_enum as enum ('free', 'standard', 'premium', 'enterprise');
  end if;
end $$;

-- Add rate limiting metadata to users table
alter table public.users
  add column if not exists last_activity_at timestamptz,
  add column if not exists rate_limit_tier text not null default 'standard';

create index if not exists idx_users_last_activity_at 
  on public.users(last_activity_at desc) 
  where last_activity_at is not null;

create index if not exists idx_users_rate_limit_tier 
  on public.users(rate_limit_tier);

-- Function to update user last activity (called on auth)
create or replace function public.update_user_activity()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
  set last_activity_at = now()
  where id = new.id;
  
  return new;
end;
$$;

-- Trigger to track last activity on auth.users
drop trigger if exists on_auth_user_login on auth.users;
create trigger on_auth_user_login
  after update on auth.users
  for each row 
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.update_user_activity();

-- Comments for documentation
comment on function public.soft_delete_record(text, uuid) is 
  'Soft delete a record by setting deleted_at timestamp';
comment on function public.restore_record(text, uuid) is 
  'Restore a soft-deleted record by clearing deleted_at';
comment on function public.purge_old_deleted_records(text, integer) is 
  'Permanently delete records that were soft-deleted N days ago (default 90)';

notify pgrst, 'reload schema';

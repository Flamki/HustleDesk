-- Analytics and Audit Logging Tables
-- Essential for compliance, debugging, and business intelligence
-- Migration created: 2026-02-17

create extension if not exists pgcrypto;

-- Audit log for all data changes (compliance & debugging)
-- Tracks who changed what and when across all tables
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes for audit log queries
create index if not exists idx_audit_logs_user_id 
  on public.audit_logs(user_id);
create index if not exists idx_audit_logs_table_name 
  on public.audit_logs(table_name);
create index if not exists idx_audit_logs_record_id 
  on public.audit_logs(record_id);
create index if not exists idx_audit_logs_created_at 
  on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_table_record 
  on public.audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_user_created 
  on public.audit_logs(user_id, created_at desc);

-- RLS for audit logs (read-only for users, append-only for system)
alter table public.audit_logs enable row level security;

drop policy if exists "Audit logs SELECT own" on public.audit_logs;
create policy "Audit logs SELECT own"
  on public.audit_logs
  for select
  using (auth.uid() = user_id);

-- Note: INSERTs are done via triggers, no direct INSERT policy needed

-- User activity log for feature usage analytics
-- Tracks user actions for product analytics and engagement metrics
create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  feature text not null,
  metadata jsonb not null default '{}'::jsonb,
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes for activity analytics
create index if not exists idx_user_activity_log_user_id 
  on public.user_activity_log(user_id);
create index if not exists idx_user_activity_log_action 
  on public.user_activity_log(action);
create index if not exists idx_user_activity_log_feature 
  on public.user_activity_log(feature);
create index if not exists idx_user_activity_log_created_at 
  on public.user_activity_log(created_at desc);
create index if not exists idx_user_activity_log_user_created 
  on public.user_activity_log(user_id, created_at desc);
create index if not exists idx_user_activity_log_user_action 
  on public.user_activity_log(user_id, action);
create index if not exists idx_user_activity_log_session 
  on public.user_activity_log(session_id) 
  where session_id is not null;

-- RLS for activity log
alter table public.user_activity_log enable row level security;

drop policy if exists "Activity log SELECT own" on public.user_activity_log;
create policy "Activity log SELECT own"
  on public.user_activity_log
  for select
  using (auth.uid() = user_id);

drop policy if exists "Activity log INSERT own" on public.user_activity_log;
create policy "Activity log INSERT own"
  on public.user_activity_log
  for insert
  with check (auth.uid() = user_id);

-- Usage metrics aggregation table (for dashboards and analytics)
-- Pre-aggregated metrics to avoid expensive calculations
create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  metric_date date not null,
  metric_type text not null,
  metric_value numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'usage_metrics_user_date_type_unique'
  ) then
    alter table public.usage_metrics
      add constraint usage_metrics_user_date_type_unique 
      unique (user_id, metric_date, metric_type);
  end if;
end $$;

-- Indexes for metrics queries
create index if not exists idx_usage_metrics_user_id 
  on public.usage_metrics(user_id);
create index if not exists idx_usage_metrics_date 
  on public.usage_metrics(metric_date desc);
create index if not exists idx_usage_metrics_type 
  on public.usage_metrics(metric_type);
create index if not exists idx_usage_metrics_user_date 
  on public.usage_metrics(user_id, metric_date desc);

-- RLS for usage metrics
alter table public.usage_metrics enable row level security;

drop policy if exists "Usage metrics SELECT own" on public.usage_metrics;
create policy "Usage metrics SELECT own"
  on public.usage_metrics
  for select
  using (auth.uid() = user_id);

-- Generic audit trigger function for any table
-- Can be attached to any table to automatically log changes
create or replace function public.audit_trigger_func()
returns trigger
language plpgsql
security definer
as $$
declare
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
begin
  if (tg_op = 'DELETE') then
    old_data = row_to_json(old)::jsonb;
    insert into public.audit_logs (
      user_id, table_name, record_id, action, old_values, new_values, changed_fields
    ) values (
      auth.uid(), tg_table_name, old.id, 'DELETE', old_data, null, null
    );
    return old;
  elsif (tg_op = 'UPDATE') then
    old_data = row_to_json(old)::jsonb;
    new_data = row_to_json(new)::jsonb;
    
    -- Calculate changed fields
    select array_agg(key) into changed_fields
    from jsonb_each(new_data)
    where new_data->>key is distinct from old_data->>key;
    
    insert into public.audit_logs (
      user_id, table_name, record_id, action, old_values, new_values, changed_fields
    ) values (
      auth.uid(), tg_table_name, new.id, 'UPDATE', old_data, new_data, changed_fields
    );
    return new;
  elsif (tg_op = 'INSERT') then
    new_data = row_to_json(new)::jsonb;
    insert into public.audit_logs (
      user_id, table_name, record_id, action, old_values, new_values, changed_fields
    ) values (
      auth.uid(), tg_table_name, new.id, 'INSERT', null, new_data, null
    );
    return new;
  end if;
  return null;
end;
$$;

-- Apply audit triggers to critical tables
drop trigger if exists audit_jobs_changes on public.jobs;
create trigger audit_jobs_changes
  after insert or update or delete on public.jobs
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_time_entries_changes on public.time_entries;
create trigger audit_time_entries_changes
  after insert or update or delete on public.time_entries
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_marketing_campaigns_changes on public.marketing_campaigns;
create trigger audit_marketing_campaigns_changes
  after insert or update or delete on public.marketing_campaigns
  for each row execute function public.audit_trigger_func();

-- Function to log user activity (called from application code)
create or replace function public.log_user_activity(
  p_action text,
  p_feature text,
  p_metadata jsonb default '{}'::jsonb,
  p_session_id text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_activity_id uuid;
begin
  insert into public.user_activity_log (
    user_id, action, feature, metadata, session_id
  ) values (
    auth.uid(), p_action, p_feature, p_metadata, p_session_id
  ) returning id into v_activity_id;
  
  return v_activity_id;
end;
$$;

-- Function to update or create usage metrics
create or replace function public.upsert_usage_metric(
  p_metric_date date,
  p_metric_type text,
  p_metric_value numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.usage_metrics (
    user_id, metric_date, metric_type, metric_value, metadata
  ) values (
    auth.uid(), p_metric_date, p_metric_type, p_metric_value, p_metadata
  )
  on conflict (user_id, metric_date, metric_type) 
  do update set
    metric_value = excluded.metric_value,
    metadata = excluded.metadata,
    updated_at = now();
end;
$$;

-- Trigger to maintain updated_at on usage_metrics
drop trigger if exists trg_usage_metrics_updated_at on public.usage_metrics;
create trigger trg_usage_metrics_updated_at
  before update on public.usage_metrics
  for each row execute procedure public.set_updated_at();

-- Comments for documentation
comment on table public.audit_logs is 
  'Audit trail of all data changes for compliance and debugging';
comment on table public.user_activity_log is 
  'User activity tracking for product analytics and engagement metrics';
comment on table public.usage_metrics is 
  'Pre-aggregated usage metrics for performance dashboards';
comment on function public.audit_trigger_func() is 
  'Generic trigger function to audit changes to any table';
comment on function public.log_user_activity(text, text, jsonb, text) is 
  'Log user activity for analytics (call from application code)';
comment on function public.upsert_usage_metric(date, text, numeric, jsonb) is 
  'Upsert daily usage metric for a user';

notify pgrst, 'reload schema';

-- Scalability Enhancements for 100k+ Users
-- Table partitioning strategy and optimization for large datasets
-- Migration created: 2026-02-17

-- NOTE: This migration prepares the structure for future partitioning
-- Actual partitioning should be implemented when tables reach critical size
-- (e.g., 10M+ rows for time_entries, 50M+ for marketing_sends)

-- Add partitioning metadata tracking table
create table if not exists public.partition_metadata (
  id uuid primary key default gen_random_uuid(),
  table_name text not null unique,
  partition_key text not null,
  partition_type text not null check (partition_type in ('range', 'list', 'hash')),
  partition_interval text,
  current_partitions integer not null default 0,
  last_partition_created_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Function to estimate table sizes and recommend partitioning
create or replace function public.get_table_size_info()
returns table (
  table_name text,
  row_count bigint,
  total_size text,
  table_size text,
  indexes_size text,
  needs_partitioning boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select
    t.table_name::text,
    (
      select count(*)::bigint
      from information_schema.tables ist
      where ist.table_schema = 'public'
      and ist.table_name = t.table_name
      limit 1
    ) as row_count,
    pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as total_size,
    pg_size_pretty(pg_relation_size('public.' || t.table_name)) as table_size,
    pg_size_pretty(pg_total_relation_size('public.' || t.table_name) - pg_relation_size('public.' || t.table_name)) as indexes_size,
    (pg_relation_size('public.' || t.table_name) > 10737418240) as needs_partitioning -- 10GB
  from information_schema.tables t
  where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  order by pg_total_relation_size('public.' || t.table_name) desc;
end;
$$;

-- Function to create monthly range partitions for time-series tables
-- This is a template function for future use when partitioning is needed
create or replace function public.create_monthly_partition(
  p_table_name text,
  p_date_column text,
  p_start_date date
)
returns text
language plpgsql
security definer
as $$
declare
  v_partition_name text;
  v_start_date date;
  v_end_date date;
  v_query text;
begin
  -- Calculate partition boundaries
  v_start_date := date_trunc('month', p_start_date)::date;
  v_end_date := (date_trunc('month', p_start_date) + interval '1 month')::date;
  
  -- Generate partition name
  v_partition_name := format(
    '%s_y%sm%s',
    p_table_name,
    to_char(v_start_date, 'YYYY'),
    to_char(v_start_date, 'MM')
  );
  
  -- Create partition (commented out - enable when needed)
  -- v_query := format(
  --   'create table if not exists public.%I partition of public.%I
  --    for values from (%L) to (%L)',
  --   v_partition_name,
  --   p_table_name,
  --   v_start_date,
  --   v_end_date
  -- );
  -- execute v_query;
  
  return v_partition_name;
end;
$$;

-- Add connection pooling configuration guidance
comment on schema public is 
  'Connection pooling: Recommended pool size = (cpu_cores * 2) + 1 for optimal performance. 
   For 100k users: Use PgBouncer with transaction pooling mode.
   Max connections = 100 for production, pool_size = 20-40 per instance.';

-- Create materialized view for expensive dashboard queries
create materialized view if not exists public.user_stats_summary as
select
  u.id as user_id,
  u.plan,
  u.created_at as user_created_at,
  count(distinct j.id) as total_jobs,
  count(distinct case when j.status = 'won' then j.id end) as jobs_won,
  count(distinct case when j.status = 'lost' then j.id end) as jobs_lost,
  count(distinct case when j.status in ('saved', 'applied', 'replied') then j.id end) as active_jobs,
  count(distinct te.id) as total_time_entries,
  coalesce(sum(te.duration_seconds), 0)::bigint as total_time_seconds,
  coalesce(sum(te.earnings), 0) as total_earnings,
  count(distinct mc.id) as total_marketing_contacts,
  count(distinct case when mc.status = 'subscribed' then mc.id end) as active_contacts,
  count(distinct mcamp.id) as total_campaigns,
  count(distinct case when mcamp.status = 'sent' then mcamp.id end) as campaigns_sent,
  max(j.created_at) as last_job_created,
  max(te.created_at) as last_time_entry_created,
  now() as refreshed_at
from public.users u
left join public.jobs j on j.user_id = u.id and j.deleted_at is null
left join public.time_entries te on te.user_id = u.id and te.deleted_at is null
left join public.marketing_contacts mc on mc.user_id = u.id and mc.status = 'subscribed'
left join public.marketing_campaigns mcamp on mcamp.user_id = u.id and mcamp.deleted_at is null
group by u.id, u.plan, u.created_at;

-- Create unique index on materialized view
create unique index if not exists idx_user_stats_summary_user_id 
  on public.user_stats_summary(user_id);

-- Create indexes for fast lookups
create index if not exists idx_user_stats_summary_plan 
  on public.user_stats_summary(plan);

create index if not exists idx_user_stats_summary_refreshed_at 
  on public.user_stats_summary(refreshed_at desc);

-- Function to refresh materialized view (call periodically)
create or replace function public.refresh_user_stats_summary()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.user_stats_summary;
end;
$$;

-- Add query plan optimization hints via statistics
-- Increase statistics target for high-cardinality columns
alter table public.jobs alter column user_id set statistics 1000;
alter table public.time_entries alter column user_id set statistics 1000;
alter table public.marketing_sends alter column campaign_id set statistics 1000;
alter table public.marketing_contacts alter column email set statistics 1000;

-- Create covering indexes for common query patterns (includes all needed columns)
-- This avoids index-only scans having to fetch from the table

create index if not exists idx_jobs_user_status_covering 
  on public.jobs(user_id, status) 
  include (title, created_at, applied_at)
  where deleted_at is null;

create index if not exists idx_time_entries_user_date_covering 
  on public.time_entries(user_id, start_time) 
  include (client, project, duration_seconds, earnings)
  where deleted_at is null;

create index if not exists idx_marketing_contacts_user_status_covering 
  on public.marketing_contacts(user_id, status) 
  include (email, first_name, last_name, subscribed_at)
  where status = 'subscribed';

-- Add table clustering hints for better sequential scan performance
-- These will improve performance when reading large ranges of data
cluster public.jobs using idx_jobs_user_status_created;
cluster public.time_entries using idx_time_entries_user_created;
cluster public.marketing_contacts using idx_marketing_contacts_user_status_subscribed;

-- Note: CLUSTER is a one-time operation. For ongoing maintenance, use:
-- SELECT pg_catalog.pg_repack('public.jobs'); (requires pg_repack extension)

-- Add autovacuum tuning for high-write tables
alter table public.time_entries set (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);

alter table public.marketing_sends set (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);

alter table public.user_activity_log set (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);

-- Add table storage parameters for better performance
alter table public.time_entries set (
  fillfactor = 90  -- Leave 10% free space for updates
);

alter table public.marketing_contacts set (
  fillfactor = 85  -- More updates expected (status changes)
);

-- Function to get slow query recommendations
create or replace function public.get_performance_recommendations()
returns table (
  recommendation_type text,
  severity text,
  details text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    'missing_index'::text as recommendation_type,
    'high'::text as severity,
    format(
      'Consider adding index on %s.%s for queries filtering by this column',
      schemaname,
      tablename
    ) as details
  from pg_stat_user_tables
  where schemaname = 'public'
  and seq_scan > 1000
  and seq_tup_read / nullif(seq_scan, 0) > 10000
  
  union all
  
  select
    'unused_index'::text,
    'low'::text,
    format(
      'Index %s.%s has not been used recently - consider dropping',
      schemaname,
      indexrelname
    )
  from pg_stat_user_indexes
  where schemaname = 'public'
  and idx_scan = 0
  and indexrelname not like '%_pkey';
end;
$$;

-- Comments for documentation
comment on table public.partition_metadata is 
  'Tracks partitioning configuration for large tables';
comment on function public.get_table_size_info() is 
  'Returns size information for all tables and partitioning recommendations';
comment on function public.create_monthly_partition(text, text, date) is 
  'Creates monthly range partition for time-series tables (template for future use)';
comment on materialized view public.user_stats_summary is 
  'Pre-aggregated user statistics for dashboard performance. Refresh hourly.';
comment on function public.refresh_user_stats_summary() is 
  'Refresh user statistics materialized view. Run via cron every hour.';
comment on function public.get_performance_recommendations() is 
  'Analyzes query patterns and suggests performance optimizations';

notify pgrst, 'reload schema';

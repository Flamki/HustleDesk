-- Usage tracking and enhanced pricing tiers
-- Safe to run multiple times.

-- Add usage tracking columns to users table
alter table public.users
  add column if not exists plan_tier varchar(20) not null default 'free',
  add column if not exists billing_interval varchar(10) default 'monthly', -- monthly, yearly
  add column if not exists usage_period_start timestamptz default now(),
  add column if not exists usage_period_end timestamptz,
  add column if not exists jobs_count integer not null default 0,
  add column if not exists clients_count integer not null default 0,
  add column if not exists time_entries_month_count integer not null default 0,
  add column if not exists proposals_month_count integer not null default 0,
  add column if not exists email_campaigns_month_count integer not null default 0,
  add column if not exists email_contacts_count integer not null default 0,
  add column if not exists marketing_websites_count integer not null default 0,
  add column if not exists portfolio_sites_count integer not null default 0,
  add column if not exists linkinbio_sites_count integer not null default 0,
  add column if not exists payment_failed_at timestamptz,
  add column if not exists payment_retry_count integer not null default 0;

-- Create index for plan tier queries
create index if not exists idx_users_plan_tier on public.users (plan_tier);

-- Update existing users with 'free' tier if they have 'free' plan
update public.users
set plan_tier = plan
where plan in ('free', 'pro', 'starter', 'enterprise');

-- Create usage_events table for detailed tracking
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_type varchar(50) not null, -- 'job_created', 'proposal_generated', 'email_sent', etc.
  resource_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS for usage_events
alter table public.usage_events enable row level security;

drop policy if exists "Users view own usage events" on public.usage_events;
create policy "Users view own usage events"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

-- Indexes for usage_events
create index if not exists idx_usage_events_user_id on public.usage_events (user_id);
create index if not exists idx_usage_events_type on public.usage_events (event_type);
create index if not exists idx_usage_events_created_at on public.usage_events (created_at);

-- Function to reset monthly usage counters
create or replace function public.reset_monthly_usage_counters()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set 
    time_entries_month_count = 0,
    proposals_month_count = 0,
    email_campaigns_month_count = 0,
    ai_credits_used = 0,
    usage_period_start = now(),
    usage_period_end = now() + interval '1 month'
  where 
    usage_period_end is not null 
    and usage_period_end <= now();
end;
$$;

-- Function to track usage event
create or replace function public.track_usage_event(
  p_event_type varchar(50),
  p_resource_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.usage_events (user_id, event_type, resource_id, metadata)
  values (v_user_id, p_event_type, p_resource_id, p_metadata)
  returning id into v_event_id;
  
  return v_event_id;
end;
$$;

-- Create subscription_changes table for audit trail
create table if not exists public.subscription_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  from_plan varchar(20),
  to_plan varchar(20) not null,
  from_interval varchar(10),
  to_interval varchar(10),
  stripe_subscription_id text,
  change_type varchar(20) not null, -- 'upgrade', 'downgrade', 'cancellation', 'reactivation'
  reason text,
  created_at timestamptz not null default now()
);

-- RLS for subscription_changes
alter table public.subscription_changes enable row level security;

drop policy if exists "Users view own subscription changes" on public.subscription_changes;
create policy "Users view own subscription changes"
  on public.subscription_changes
  for select
  using (auth.uid() = user_id);

-- Indexes for subscription_changes
create index if not exists idx_subscription_changes_user_id on public.subscription_changes (user_id);
create index if not exists idx_subscription_changes_created_at on public.subscription_changes (created_at);

-- Comments for documentation
comment on column public.users.plan_tier is 'Current pricing tier: free, starter, pro, enterprise';
comment on column public.users.billing_interval is 'Billing cycle: monthly or yearly';
comment on column public.users.usage_period_start is 'Start of current usage billing period';
comment on column public.users.usage_period_end is 'End of current usage billing period';
comment on column public.users.payment_failed_at is 'Timestamp of last failed payment';
comment on column public.users.payment_retry_count is 'Number of payment retry attempts';

comment on table public.usage_events is 'Tracks feature usage for analytics and billing';
comment on table public.subscription_changes is 'Audit trail for plan upgrades, downgrades, and cancellations';

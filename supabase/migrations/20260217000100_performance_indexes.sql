-- Performance Optimization: Add Missing Composite Indexes
-- These indexes are critical for query performance at scale (100k+ users)
-- Migration created: 2026-02-17

-- Marketing sends: Campaign analytics queries
-- Query pattern: "SELECT COUNT(*) FROM marketing_sends WHERE campaign_id = ? AND status = ?"
create index if not exists idx_marketing_sends_campaign_status 
  on public.marketing_sends(campaign_id, status);

-- Marketing sends: User campaign history with timing
-- Query pattern: "SELECT * FROM marketing_sends WHERE user_id = ? ORDER BY created_at DESC"
create index if not exists idx_marketing_sends_user_created 
  on public.marketing_sends(user_id, created_at desc);

-- Time entries: Recent entries for user
-- Query pattern: "SELECT * FROM time_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
create index if not exists idx_time_entries_user_created 
  on public.time_entries(user_id, created_at desc);

-- Time entries: Date range queries for reports
-- Query pattern: "SELECT * FROM time_entries WHERE user_id = ? AND start_time BETWEEN ? AND ?"
create index if not exists idx_time_entries_user_start_time 
  on public.time_entries(user_id, start_time desc);

-- Marketing site signups: Duplicate detection and site analytics
-- Query pattern: "SELECT * FROM marketing_site_signups WHERE site_id = ? AND email = ?"
create index if not exists idx_marketing_site_signups_site_email 
  on public.marketing_site_signups(site_id, email);

-- Marketing site signups: User analytics queries
-- Query pattern: "SELECT COUNT(*) FROM marketing_site_signups WHERE user_id = ? AND created_at > ?"
create index if not exists idx_marketing_site_signups_user_created 
  on public.marketing_site_signups(user_id, created_at desc);

-- Marketing campaigns: Status filtering with recency
-- Query pattern: "SELECT * FROM marketing_campaigns WHERE user_id = ? AND status = 'draft' ORDER BY updated_at DESC"
create index if not exists idx_marketing_campaigns_user_status_updated 
  on public.marketing_campaigns(user_id, status, updated_at desc);

-- Marketing contacts: Segment queries by status
-- Query pattern: "SELECT * FROM marketing_contacts WHERE user_id = ? AND status = 'subscribed' ORDER BY subscribed_at DESC"
create index if not exists idx_marketing_contacts_user_status_subscribed 
  on public.marketing_contacts(user_id, status, subscribed_at desc);

-- Jobs: Pipeline views with status and recency
-- Query pattern: "SELECT * FROM jobs WHERE user_id = ? AND status = 'applied' ORDER BY created_at DESC"
create index if not exists idx_jobs_user_status_created 
  on public.jobs(user_id, status, created_at desc);

-- Jobs: Pipeline with update tracking
-- Query pattern: "SELECT * FROM jobs WHERE user_id = ? AND status IN ('saved', 'applied') ORDER BY applied_at DESC"
create index if not exists idx_jobs_user_applied 
  on public.jobs(user_id, applied_at desc) where applied_at is not null;

-- Time entries: Client project filtering
-- Query pattern: "SELECT * FROM time_entries WHERE user_id = ? AND client = ? AND project = ?"
create index if not exists idx_time_entries_user_client_project 
  on public.time_entries(user_id, client, project);

-- Marketing portfolio items: Site filtering with sort order
-- Query pattern: "SELECT * FROM marketing_portfolio_items WHERE site_id = ? ORDER BY sort_order"
create index if not exists idx_marketing_portfolio_items_site_sort 
  on public.marketing_portfolio_items(site_id, sort_order);

-- Comment on performance indexes for documentation
comment on index idx_marketing_sends_campaign_status is 
  'Performance: Campaign analytics queries (sends per status)';
comment on index idx_time_entries_user_created is 
  'Performance: Recent time entries listing';
comment on index idx_marketing_site_signups_site_email is 
  'Performance: Duplicate signup detection';
comment on index idx_marketing_campaigns_user_status_updated is 
  'Performance: Campaign status filtering';

notify pgrst, 'reload schema';

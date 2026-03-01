# Database Documentation

## Overview

GetSoloDesk uses **Supabase PostgreSQL** as its primary database with Row Level Security (RLS) enabled on all tables. The database is designed to scale to 100,000+ users with proper indexing, partitioning strategies, and performance optimizations.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Core Tables](#core-tables)
- [Analytics & Audit Tables](#analytics--audit-tables)
- [Indexes & Performance](#indexes--performance)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Constraints & Validation](#constraints--validation)
- [Triggers & Functions](#triggers--functions)
- [Scalability Features](#scalability-features)
- [Migration Strategy](#migration-strategy)

---

## Schema Overview

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓ (cascade delete)
users
    ├── jobs (1:N)
    ├── time_entries (1:N)
    │   └── jobs (optional FK)
    ├── freelancer_profiles (1:1)
    ├── client_segmentation_settings (1:1)
    ├── notification_settings (1:1)
    ├── template_overrides (1:N)
    ├── marketing_contacts (1:N)
    ├── marketing_campaigns (1:N)
    │   └── marketing_sends (1:N)
    │       └── marketing_contacts (FK)
    ├── marketing_sites (1:N)
    │   ├── marketing_portfolio_items (1:N)
    │   ├── marketing_site_signups (1:N)
    │   └── marketing_site_events (1:N)
    ├── time_share_links (1:N)
    ├── time_entry_share_links (1:N)
    │   └── time_entries (FK)
    ├── audit_logs (1:N)
    ├── user_activity_log (1:N)
    └── usage_metrics (1:N)

email_subscriptions (standalone)
```

---

## Core Tables

### users

Primary user profile extending Supabase auth.users.

**Columns:**
- `id` (uuid, PK): Links to auth.users.id
- `email` (varchar, unique, not null): User email
- `plan` (varchar): Subscription plan (free, pro, enterprise)
- `ai_credits_used` (integer): AI credits consumed
- `ai_credits_limit` (integer): AI credits quota
- `skills` (text[]): User skills array
- `stripe_customer_id` (text, unique): Stripe customer reference
- `stripe_subscription_id` (text, unique): Stripe subscription reference
- `stripe_subscription_status` (text): Subscription status
- `stripe_current_period_end` (timestamptz): Billing period end
- `last_activity_at` (timestamptz): Last user activity timestamp
- `rate_limit_tier` (text): Rate limiting tier
- `created_at` (timestamptz): Account creation timestamp

**Indexes:**
- `idx_users_email` - Email lookup
- `idx_users_plan` - Plan filtering
- `idx_users_stripe_customer_id` - Stripe integration
- `idx_users_stripe_subscription_id` - Subscription lookup
- `idx_users_last_activity_at` - Activity tracking
- `idx_users_rate_limit_tier` - Rate limit queries

**RLS Policies:**
- Users can SELECT and UPDATE their own profile only

**Triggers:**
- `on_auth_user_created`: Auto-creates user profile on signup
- `on_auth_user_login`: Updates last_activity_at on login

---

### jobs

Job opportunities tracking and pipeline management.

**Columns:**
- `id` (uuid, PK): Job identifier
- `user_id` (uuid, FK → users): Owner
- `title` (varchar(500), not null): Job title
- `platform` (job_platform enum): upwork, fiverr, linkedin, other
- `company` (varchar(255)): Company name
- `job_description` (text, not null): Full description
- `budget_min` (decimal): Minimum budget
- `budget_max` (decimal): Maximum budget
- `currency` (varchar(10)): Currency code
- `proposed_price` (decimal): Your proposal price
- `notes` (text): Private notes
- `proposal` (text): Proposal draft
- `status` (job_status enum): saved, applied, replied, won, lost
- `followup_date` (date): Next followup date
- `applied_at` (timestamptz): Application timestamp
- `closed_at` (timestamptz): Close timestamp (won/lost)
- `deleted_at` (timestamptz): Soft delete timestamp
- `created_at` (timestamptz): Creation timestamp

**Indexes:**
- `idx_jobs_user_id` - User filtering
- `idx_jobs_status` - Status filtering
- `idx_jobs_followup_date` - Calendar queries
- `idx_jobs_user_status_created` - Pipeline views (composite)
- `idx_jobs_user_applied` - Applied jobs (partial, where applied_at is not null)
- `idx_jobs_deleted_at` - Soft delete queries (partial)
- `idx_jobs_user_status_covering` - Covering index (includes title, created_at, applied_at)

**RLS Policies:**
- Full CRUD access for owner only
- Soft-deleted records separated in dedicated policy

**Triggers:**
- `trg_jobs_status_fields`: Auto-sets applied_at, followup_date, closed_at
- `audit_jobs_changes`: Audit log for compliance

**Constraints:**
- `jobs_budget_range_valid`: budget_max >= budget_min
- `jobs_positive_amounts`: All amounts >= 0
- `jobs_title_not_empty`: Title must not be empty
- `jobs_followup_after_applied`: followup_date >= applied_at

---

### time_entries

Time tracking for hourly freelancers.

**Columns:**
- `id` (uuid, PK): Entry identifier
- `user_id` (uuid, FK → users): Owner
- `job_id` (uuid, FK → jobs, set null): Associated job
- `client` (varchar(255), not null): Client name
- `project` (varchar(255), not null): Project name
- `description` (text): Work description
- `start_time` (timestamptz, not null): Start timestamp
- `end_time` (timestamptz, not null): End timestamp
- `duration_seconds` (integer, not null): Duration in seconds
- `hourly_rate` (decimal, not null): Hourly rate
- `currency` (varchar(10)): Currency code
- `earnings` (decimal, not null): Total earnings
- `deleted_at` (timestamptz): Soft delete timestamp
- `created_at` (timestamptz): Creation timestamp

**Indexes:**
- `idx_time_entries_user_id` - User filtering
- `idx_time_entries_start_time` - Time range queries (DESC)
- `idx_time_entries_job_id` - Job association
- `idx_time_entries_user_created` - Recent entries (composite, DESC)
- `idx_time_entries_user_start_time` - Date range reports (composite, DESC)
- `idx_time_entries_user_client_project` - Client/project filtering (composite)
- `idx_time_entries_deleted_at` - Soft delete queries (partial)
- `idx_time_entries_user_date_covering` - Covering index

**RLS Policies:**
- Full CRUD access for owner only
- Soft-deleted records handled separately

**Triggers:**
- `audit_time_entries_changes`: Audit log for compliance

**Constraints:**
- `time_entries_end_after_start`: end_time >= start_time
- `duration_seconds >= 0`
- `hourly_rate >= 0`
- `earnings >= 0`
- `time_entries_client_not_empty`: Client must not be empty
- `time_entries_project_not_empty`: Project must not be empty

**Storage Settings:**
- `fillfactor = 90` - 10% free space for updates
- Aggressive autovacuum tuning for high-write workload

---

### marketing_contacts

Email marketing contact list (opt-in only).

**Columns:**
- `id` (uuid, PK): Contact identifier
- `user_id` (uuid, FK → users): Owner
- `email` (text, not null): Contact email
- `first_name`, `last_name`, `company` (text): Contact info
- `tags` (text[]): Categorization tags
- `status` (text): subscribed, unsubscribed, pending
- `subscribed_at` (timestamptz): Subscription timestamp
- `unsubscribed_at` (timestamptz): Unsubscribe timestamp
- `unsubscribe_token` (text, unique, not null): Unsubscribe token
- `deleted_at` (timestamptz): Soft delete timestamp
- `created_at`, `updated_at` (timestamptz): Timestamps

**Indexes:**
- `idx_marketing_contacts_user_id` - User filtering
- `idx_marketing_contacts_email` - Email lookup
- `idx_marketing_contacts_status` - Status filtering
- `idx_marketing_contacts_tags` (GIN) - Array search optimization
- `idx_marketing_contacts_user_status_subscribed` - Segment queries (composite, DESC)
- `idx_marketing_contacts_deleted_at` - Soft delete queries (partial)
- `idx_marketing_contacts_user_status_covering` - Covering index

**Unique Constraints:**
- `(user_id, email)` - One contact per email per user
- `unsubscribe_token` - Unique unsubscribe links

**RLS Policies:**
- Full CRUD access for owner only

**Triggers:**
- `trg_marketing_contacts_updated_at`: Auto-update updated_at

**Constraints:**
- Email format validation
- Token format validation (hex, min 32 chars)
- `unsubscribe_after_subscribe`: unsubscribed_at >= subscribed_at
- No null elements in tags array

**Storage Settings:**
- `fillfactor = 85` - More free space for status updates

---

### marketing_campaigns

Email marketing campaigns.

**Columns:**
- `id` (uuid, PK): Campaign identifier
- `user_id` (uuid, FK → users): Owner
- `name` (text): Campaign name
- `subject` (text, not null): Email subject
- `from_name`, `from_email` (text, not null): Sender info
- `reply_to` (text): Reply-to address
- `body_text`, `body_html` (text): Email content
- `status` (text): draft, sending, sent, failed
- `audience_tag` (text): Target tag filter
- `deleted_at` (timestamptz): Soft delete timestamp
- `created_at`, `updated_at`, `sent_at` (timestamptz): Timestamps

**Indexes:**
- `idx_marketing_campaigns_user_id` - User filtering
- `idx_marketing_campaigns_status` - Status filtering
- `idx_marketing_campaigns_user_status_updated` - Dashboard queries (composite, DESC)
- `idx_marketing_campaigns_deleted_at` - Soft delete queries (partial)

**RLS Policies:**
- Full CRUD access for owner only

**Triggers:**
- `trg_marketing_campaigns_updated_at`: Auto-update updated_at
- `audit_marketing_campaigns_changes`: Audit log for compliance

**Constraints:**
- `marketing_campaigns_subject_not_empty`: Subject required

---

### marketing_sends

Email send log per recipient.

**Columns:**
- `id` (uuid, PK): Send record identifier
- `user_id` (uuid, FK → users): Owner
- `campaign_id` (uuid, FK → marketing_campaigns): Campaign
- `contact_id` (uuid, FK → marketing_contacts): Recipient
- `to_email` (text, not null): Recipient email
- `status` (text): queued, sent, failed, skipped
- `error` (text): Error message if failed
- `provider_id` (text): Email provider ID
- `sent_at` (timestamptz): Send timestamp
- `created_at` (timestamptz): Creation timestamp

**Indexes:**
- `idx_marketing_sends_user_id` - User filtering
- `idx_marketing_sends_campaign_id` - Campaign lookup
- `idx_marketing_sends_contact_id` - Contact history
- `idx_marketing_sends_status` - Status filtering
- `idx_marketing_sends_campaign_status` - Analytics queries (composite)
- `idx_marketing_sends_user_created` - User history (composite, DESC)

**RLS Policies:**
- Full CRUD access for owner only

**Storage Settings:**
- Aggressive autovacuum tuning for high-write workload

---

## Analytics & Audit Tables

### audit_logs

Complete audit trail of all data changes.

**Columns:**
- `id` (uuid, PK): Log entry identifier
- `user_id` (uuid, FK → users, set null): User who made change
- `table_name` (text, not null): Affected table
- `record_id` (uuid, not null): Affected record
- `action` (text, not null): INSERT, UPDATE, DELETE
- `old_values`, `new_values` (jsonb): Before/after state
- `changed_fields` (text[]): List of changed columns
- `ip_address` (inet): Client IP
- `user_agent` (text): Client user agent
- `created_at` (timestamptz): Change timestamp

**Indexes:**
- `idx_audit_logs_user_id` - User filtering
- `idx_audit_logs_table_name` - Table filtering
- `idx_audit_logs_record_id` - Record history
- `idx_audit_logs_created_at` - Time range queries (DESC)
- `idx_audit_logs_table_record` - Table + record lookup (composite)
- `idx_audit_logs_user_created` - User activity timeline (composite, DESC)

**RLS Policies:**
- Users can SELECT their own audit logs only
- No direct INSERT (done via triggers)

**Applied To:**
- `jobs`
- `time_entries`
- `marketing_campaigns`

---

### user_activity_log

Feature usage analytics and engagement tracking.

**Columns:**
- `id` (uuid, PK): Activity identifier
- `user_id` (uuid, FK → users): User
- `action` (text, not null): Action performed
- `feature` (text, not null): Feature used
- `metadata` (jsonb): Additional context
- `session_id` (text): Session identifier
- `ip_address` (inet): Client IP
- `user_agent` (text): Client user agent
- `created_at` (timestamptz): Activity timestamp

**Indexes:**
- `idx_user_activity_log_user_id` - User filtering
- `idx_user_activity_log_action` - Action filtering
- `idx_user_activity_log_feature` - Feature filtering
- `idx_user_activity_log_created_at` - Time range queries (DESC)
- `idx_user_activity_log_user_created` - User timeline (composite, DESC)
- `idx_user_activity_log_user_action` - User + action queries (composite)
- `idx_user_activity_log_session` - Session tracking (partial, where not null)

**RLS Policies:**
- Users can SELECT and INSERT their own activity only

**Storage Settings:**
- Aggressive autovacuum tuning for high-write workload

---

### usage_metrics

Pre-aggregated daily metrics for dashboard performance.

**Columns:**
- `id` (uuid, PK): Metric identifier
- `user_id` (uuid, FK → users): User
- `metric_date` (date, not null): Metric date
- `metric_type` (text, not null): Metric type
- `metric_value` (numeric, not null): Metric value
- `metadata` (jsonb): Additional context
- `created_at`, `updated_at` (timestamptz): Timestamps

**Unique Constraint:**
- `(user_id, metric_date, metric_type)` - One value per user per day per type

**Indexes:**
- `idx_usage_metrics_user_id` - User filtering
- `idx_usage_metrics_date` - Date range queries (DESC)
- `idx_usage_metrics_type` - Type filtering
- `idx_usage_metrics_user_date` - User metrics (composite, DESC)

**RLS Policies:**
- Users can SELECT their own metrics only

**Triggers:**
- `trg_usage_metrics_updated_at`: Auto-update updated_at

---

### user_stats_summary (Materialized View)

Pre-computed user statistics for expensive dashboard queries.

**Columns:**
- `user_id` (uuid, unique): User identifier
- `plan` (text): User plan
- `user_created_at` (timestamptz): Account creation
- `total_jobs`, `jobs_won`, `jobs_lost`, `active_jobs` (bigint): Job counts
- `total_time_entries` (bigint): Time entry count
- `total_time_seconds` (bigint): Total tracked time
- `total_earnings` (numeric): Total earnings
- `total_marketing_contacts`, `active_contacts` (bigint): Contact counts
- `total_campaigns`, `campaigns_sent` (bigint): Campaign counts
- `last_job_created`, `last_time_entry_created` (timestamptz): Last activity
- `refreshed_at` (timestamptz): View refresh timestamp

**Indexes:**
- `idx_user_stats_summary_user_id` (unique) - User lookup
- `idx_user_stats_summary_plan` - Plan filtering
- `idx_user_stats_summary_refreshed_at` - Freshness check (DESC)

**Refresh Strategy:**
- `refresh materialized view concurrently public.user_stats_summary`
- Recommended: Hourly via cron/pg_cron

---

## Indexes & Performance

### Index Types

1. **Single-column indexes**: Basic lookups (user_id, email, status)
2. **Composite indexes**: Multi-column queries (user_id + status + date)
3. **Covering indexes**: Include extra columns to avoid table lookups
4. **Partial indexes**: Index only relevant rows (where deleted_at is null)
5. **GIN indexes**: Array and JSONB searches (tags, metadata)

### Performance Features

- **Table clustering**: Physical ordering matches index for better scan performance
- **Statistics targets**: Increased to 1000 for high-cardinality columns
- **Autovacuum tuning**: Aggressive settings for high-write tables
- **Fillfactor**: 85-90% to leave space for updates
- **Covering indexes**: Avoid index-only scan table lookups

### Monitoring Functions

```sql
-- Get table sizes and partitioning recommendations
SELECT * FROM public.get_table_size_info();

-- Get performance recommendations
SELECT * FROM public.get_performance_recommendations();

-- Refresh user stats dashboard
SELECT public.refresh_user_stats_summary();
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Standard pattern:

### User-owned tables
```sql
-- SELECT: User can see their own records
using (auth.uid() = user_id)

-- INSERT: User can create records for themselves
with check (auth.uid() = user_id)

-- UPDATE: User can update their own records
using (auth.uid() = user_id) with check (auth.uid() = user_id)

-- DELETE: User can delete their own records
using (auth.uid() = user_id)
```

### Public read tables (share links)
```sql
-- Public read with expiry validation
using (published = true and (expires_at is null or expires_at > now()))
```

### Service role tables (public endpoints)
```sql
-- Service role can insert (bypasses RLS but policy must exist)
with check (true)
```

### Soft delete support
- Separate policies for active (`deleted_at is null`) and deleted records
- Allows recovery UI to show deleted items

---

## Constraints & Validation

### Email Validation
```sql
check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

### URL Validation
```sql
check (url is null or url ~* '^https?://')
```

### Numeric Validation
- All amounts, rates, credits >= 0
- Budget: max >= min

### String Validation
- Slugs: lowercase alphanumeric + hyphens, 3-63 chars
- Hex colors: #RRGGBB format
- Tokens: hexadecimal, min 32 chars
- Stripe IDs: cus_* or sub_* format

### Date/Time Validation
- end_time >= start_time
- unsubscribed_at >= subscribed_at
- expires_at > created_at
- followup_date >= applied_at

### Array Validation
- No null elements in skill/tag arrays

---

## Triggers & Functions

### Auto-generated Fields

**handle_new_user()**
- Creates user profile when auth.users record created
- Sets default plan, credits, skills

**handle_job_status_fields()**
- Auto-sets applied_at when status → 'applied'
- Auto-sets followup_date (applied_at + 3 days)
- Auto-sets closed_at when status → 'won'/'lost'
- Clears closed_at when status changes back

**set_updated_at()**
- Updates updated_at column on every UPDATE
- Applied to: marketing_contacts, marketing_campaigns, marketing_sites, marketing_portfolio_items, template_overrides, usage_metrics

**update_user_activity()**
- Updates last_activity_at when user logs in
- Triggered on auth.users last_sign_in_at change

### Audit & Analytics

**audit_trigger_func()**
- Generic trigger for change tracking
- Captures old/new values, changed fields
- Logs to audit_logs table

**log_user_activity(action, feature, metadata, session_id)**
- Manual activity logging from application code
- Returns activity ID

**upsert_usage_metric(date, type, value, metadata)**
- Upsert daily metric value
- Updates existing or inserts new

### Soft Delete

**soft_delete_record(table_name, record_id)**
- Sets deleted_at timestamp
- Validates table name (security)
- Returns success boolean

**restore_record(table_name, record_id)**
- Clears deleted_at timestamp
- Restores soft-deleted record

**purge_old_deleted_records(table_name, days_old)**
- Permanently deletes old soft-deleted records
- Default: 90 days
- Returns count deleted

### Partitioning (Future)

**create_monthly_partition(table_name, date_column, start_date)**
- Template function for future partitioning
- Creates monthly range partitions
- Currently commented out, enable when needed

---

## Scalability Features

### For 100,000+ Users

**Connection Pooling**
- Use PgBouncer in transaction mode
- Recommended: 20-40 connections per instance
- Max connections: 100 for production
- Formula: pool_size = (cpu_cores × 2) + 1

**Query Optimization**
- Materialized views for expensive aggregations
- Covering indexes to reduce table access
- Table clustering for sequential scan performance
- Partial indexes to reduce size

**Write-Heavy Tables**
- Autovacuum tuning (scale_factor = 0.01)
- Applied to: time_entries, marketing_sends, user_activity_log
- Prevents table bloat at high write volume

**Future Partitioning**
- Prepared for time-series partitioning
- Target: 10M+ rows (time_entries) or 50M+ rows (marketing_sends)
- Monthly range partitions on created_at/start_time
- Template function ready: create_monthly_partition()

**Monitoring**
- get_table_size_info() - Table sizes and partition recommendations
- get_performance_recommendations() - Slow query analysis
- partition_metadata table - Partition tracking

---

## Migration Strategy

### Migration Files

Migrations are located in `supabase/migrations/` and run in timestamp order:

**Foundation (Phase 1):**
- `20260215_phase1_foundation_core.sql` - Users, RLS, triggers

**Features:**
- `20260216000100_feature_1_2_jobs.sql` - Jobs pipeline
- `20260216000200_email_subscriptions.sql` - Email opt-ins
- `20260216000300_time_tracker.sql` - Time tracking
- `20260216000400_client_segmentation_settings.sql` - Client settings
- `20260216000500_billing_stripe.sql` - Stripe integration
- `20260216000600_notification_settings.sql` - Notifications
- `20260216000700_time_share_links.sql` - Time sharing
- `20260216000800_time_entry_share_links.sql` - Entry sharing
- `20260216000900_email_marketing.sql` - Marketing campaigns
- `20260216001000_template_overrides.sql` - Templates
- `20260216001100_marketing_websites.sql` - Public sites
- `20260216001200_marketing_site_events.sql` - Site analytics
- `20260216001300_marketing_site_kind_and_config.sql` - Site types
- `20260216001400_enforce_one_site_per_kind.sql` - Site constraints
- `20260216001500_freelancer_profiles.sql` - User profiles

**Performance & Security (Phase 2):**
- `20260217000100_performance_indexes.sql` - Composite indexes
- `20260217000200_analytics_and_audit_tables.sql` - Audit & analytics
- `20260217000300_rls_improvements_and_security.sql` - Security enhancements
- `20260217000400_data_validation_constraints.sql` - Data validation
- `20260217000500_scalability_enhancements.sql` - Scale to 100k users

### Running Migrations

**Using Supabase CLI:**
```bash
# Apply all pending migrations
supabase db push

# Reset database (WARNING: destroys data)
supabase db reset

# Create new migration
supabase migration new migration_name
```

**Using SQL:**
```sql
-- Migrations are applied via Supabase automatically
-- Schema changes notify PostgREST
notify pgrst, 'reload schema';
```

### Best Practices

1. **Always use transactions** - Migrations are atomic
2. **Idempotent migrations** - Use `if not exists` clauses
3. **Drop-before-create** - For policies, triggers, functions
4. **Test migrations** - Run on staging before production
5. **Backward compatibility** - Old code works during deploy
6. **No data loss** - Use ALTER ADD COLUMN, not DROP/CREATE

---

## Maintenance Tasks

### Daily
- Monitor slow query log
- Check autovacuum activity
- Verify backup completion

### Weekly
- Review table sizes: `SELECT * FROM get_table_size_info()`
- Review performance: `SELECT * FROM get_performance_recommendations()`
- Check for unused indexes

### Monthly
- Analyze table statistics: `ANALYZE;`
- Review partitioning needs
- Purge old soft-deleted records

### Quarterly
- Review and optimize RLS policies
- Update autovacuum settings if needed
- Plan partitioning for large tables

---

## Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)


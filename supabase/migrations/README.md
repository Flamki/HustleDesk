# Database Migrations

This directory contains all SQL migration files for the GetSoloDesk database schema.

## Migration Naming Convention

Migrations use timestamp-based naming:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Example: `20260217000100_performance_indexes.sql`

## Migration Order

Migrations are applied in alphabetical order (which corresponds to chronological order due to timestamps).

### Phase 1: Foundation & Core (Feb 15-16, 2026)

1. **20260215_phase1_foundation_core.sql**
   - Users table with RLS
   - Auto-profile creation trigger
   - Basic indexes

2. **20260216000100_feature_1_2_jobs.sql**
   - Jobs pipeline with status tracking
   - Job status automation triggers

3. **20260216000200_email_subscriptions.sql**
   - Public email subscription list

4. **20260216000300_time_tracker.sql**
   - Time entries for hourly tracking

5. **20260216000400_client_segmentation_settings.sql**
   - Client segmentation configuration

6. **20260216000500_billing_stripe.sql**
   - Stripe billing integration fields

7. **20260216000600_notification_settings.sql**
   - User notification preferences

8. **20260216000700_time_share_links.sql**
   - Public time tracking share links

9. **20260216000800_time_entry_share_links.sql**
   - Individual time entry share links

10. **20260216000900_email_marketing.sql**
    - Marketing contacts, campaigns, sends
    - Opt-in consent tracking

11. **20260216001000_template_overrides.sql**
    - Template customization

12. **20260216001100_marketing_websites.sql**
    - Public marketing sites (portfolio, link in bio)
    - Portfolio items and signups

13. **20260216001200_marketing_site_events.sql**
    - Analytics event tracking

14. **20260216001300_marketing_site_kind_and_config.sql**
    - Site type configuration

15. **20260216001400_enforce_one_site_per_kind.sql**
    - Constraint: one site per type per user

16. **20260216001500_freelancer_profiles.sql**
    - Extended user profile data

### Phase 2: Performance, Analytics & Security (Feb 17, 2026)

17. **20260217000100_performance_indexes.sql**
    - 12 composite indexes for common query patterns
    - Covering indexes for hot queries
    - Comments for documentation

18. **20260217000200_analytics_and_audit_tables.sql**
    - audit_logs: Change tracking for compliance
    - user_activity_log: Feature usage analytics
    - usage_metrics: Pre-aggregated metrics
    - Audit trigger function and applications
    - Helper functions for logging

19. **20260217000300_rls_improvements_and_security.sql**
    - Service role INSERT policies for public endpoints
    - Share link expiry validation in RLS
    - Soft delete support (deleted_at columns)
    - Soft delete helper functions
    - Rate limiting metadata
    - Last activity tracking

20. **20260217000400_data_validation_constraints.sql**
    - 6 ENUMs for type safety
    - 50+ CHECK constraints for data validation
    - Email, URL, token format validation
    - Numeric, date/time logical constraints
    - Array element validation

21. **20260217000500_scalability_enhancements.sql**
    - Partition metadata tracking
    - Template function for monthly partitioning
    - user_stats_summary materialized view
    - Covering indexes and table clustering
    - Autovacuum tuning
    - Performance monitoring functions

## Running Migrations

### Using Supabase CLI

```bash
# Apply all pending migrations
supabase db push

# Reset database (WARNING: destroys data)
supabase db reset

# Create new migration
supabase migration new migration_name
```

### Manual Application

```bash
# Apply specific migration
psql <connection-string> -f supabase/migrations/20260217000100_performance_indexes.sql

# Apply all migrations in order
for file in supabase/migrations/*.sql; do
  echo "Applying $file..."
  psql <connection-string> -f "$file"
done
```

## Migration Best Practices

1. **Idempotent**: Use `if not exists`, `drop if exists`, `do $$ begin ... end $$;`
2. **Safe**: Use `add column if not exists`, not `drop column`
3. **Backward compatible**: Old code works during deployment
4. **Tested**: Test on staging before production
5. **Documented**: Add comments explaining complex logic
6. **Notify PostgREST**: End with `notify pgrst, 'reload schema';`

## Testing Migrations

Before applying to production:

1. **Syntax check**:
   ```bash
   psql -f migration.sql --dry-run
   ```

2. **Test on staging**:
   ```bash
   # Copy production to staging
   pg_dump production | psql staging
   
   # Apply migration
   psql staging -f migration.sql
   
   # Test application
   npm run test
   ```

3. **Verify constraints**:
   ```sql
   -- Check for constraint violations
   select * from jobs where budget_max < budget_min;
   select * from time_entries where end_time < start_time;
   ```

4. **Performance test**:
   ```sql
   -- Check index usage
   explain analyze select * from jobs where user_id = '<id>' and status = 'applied';
   ```

## Rollback Strategy

### Option 1: Pre-deployment Backup
```bash
# Before migration
pg_dump <db> > pre_migration_backup.sql

# If migration fails, restore
psql <db> < pre_migration_backup.sql
```

### Option 2: Reverse Migration
Create a reverse migration that undoes changes:
```sql
-- Original: 20260217000100_performance_indexes.sql
create index idx_jobs_user_status_created on jobs(user_id, status, created_at desc);

-- Rollback: 20260217000101_rollback_performance_indexes.sql
drop index if exists idx_jobs_user_status_created;
```

### Option 3: Point-in-Time Recovery
Use Supabase PITR to restore to before migration:
```bash
supabase db restore --timestamp "2026-02-17 14:00:00"
```

## Common Issues

### Issue: Migration already applied
**Symptom**: `ERROR: relation "table_name" already exists`
**Solution**: Migration is idempotent, can be safely re-run

### Issue: Constraint violation
**Symptom**: `ERROR: check constraint violated`
**Solution**: Fix data before adding constraint:
```sql
-- Find violations
select * from table_name where condition_fails;

-- Fix data
update table_name set column = correct_value where condition_fails;

-- Then apply constraint
alter table table_name add constraint ...;
```

### Issue: Index creation times out
**Symptom**: Long-running index creation
**Solution**: Use `create index concurrently`:
```sql
create index concurrently idx_name on table(column);
```

### Issue: Function already exists
**Symptom**: `ERROR: function already exists`
**Solution**: Use `create or replace function` or `drop function if exists`

## Monitoring Post-Migration

After applying migrations:

1. **Check table sizes**:
   ```sql
   select * from public.get_table_size_info();
   ```

2. **Check for slow queries**:
   ```sql
   select * from pg_stat_statements
   where mean_exec_time > 100
   order by mean_exec_time desc;
   ```

3. **Verify RLS policies**:
   ```sql
   -- As user (should only see own records)
   select * from jobs;
   ```

4. **Test constraints**:
   ```sql
   -- Should fail
   insert into jobs (user_id, title, job_description, budget_max, budget_min)
   values ('<user-id>', 'Test', 'Description', 100, 200);
   -- ERROR: check constraint "jobs_budget_range_valid" violated
   ```

## Migration Checklist

Before deploying migration:

- [ ] Migration tested on staging
- [ ] Backup taken
- [ ] Team notified of deployment
- [ ] Migration is idempotent
- [ ] Backward compatible with current code
- [ ] Performance impact assessed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

After deploying migration:

- [ ] Verify migration applied successfully
- [ ] Check for constraint violations
- [ ] Monitor query performance
- [ ] Test affected features
- [ ] Verify RLS policies
- [ ] Keep backup for 24-48 hours

## Resources

- [DATABASE.md](../docs/DATABASE.md) - Complete schema documentation
- [BACKUP_RECOVERY.md](../docs/BACKUP_RECOVERY.md) - Backup and recovery procedures
- [SCALABILITY.md](../docs/SCALABILITY.md) - Scaling strategy
- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)


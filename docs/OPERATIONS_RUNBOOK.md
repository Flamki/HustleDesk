# Operations Runbook

## Routine Checks

Daily:
- Vercel function error rate
- API latency (p95/p99)
- Supabase DB health and slow queries
- Database connection pool usage
- Long-running queries (>5s)
- Stripe webhook delivery failures
- Backup completion status

Weekly:
- Campaign send success/failure ratios
- Public site conversion metrics
- Traffic anomalies and abuse patterns
- Database table sizes and growth
- Index usage statistics
- Soft-deleted records cleanup

## Incident Triage

1. Identify failing endpoint:
- Check Vercel logs by function path.

2. Confirm dependency status:
- Supabase availability
- Stripe API status
- Resend status
- Upstash status

3. Apply immediate controls:
- Temporarily reduce heavy traffic features if needed
- Tighten rate limits (if abuse)
- Disable campaign sending if provider key invalid

4. Rollback strategy:
- Revert to previous Vercel deployment if regression introduced

## Rate Limiting Behavior

Endpoints protected:
- `POST /api/marketing/send`
- `POST /api/public/site-event`

Store preference:
- Upstash Redis (global)
- fallback: in-memory (per instance)

Operational header:
- `X-RateLimit-Store: upstash|memory`

## Cost Control Playbook

1. Confirm cache headers active:
- `/assets/*` immutable cache
- `/api/public/site` edge cache

2. Monitor top invocation routes:
- Public events write endpoint
- Marketing send endpoint

3. Add guardrails if needed:
- lower rate limits
- stricter event ingestion validation
- bot filtering at edge/WAF

## Performance Verification

Commands:
```bash
npx tsc --noEmit
npm run build
```

Load tests:
```bash
npm run loadtest:jobs
npm run loadtest:dashboard
npm run loadtest:time
npm run loadtest:public-site
```

## Database Operations

### Daily Database Checks

Check database health:
```sql
-- Connection count
select count(*) as connections from pg_stat_activity;

-- Active queries
select count(*) as active_queries 
from pg_stat_activity 
where state = 'active';

-- Cache hit ratio (should be >90%)
select round(
  100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2
) as cache_hit_ratio
from pg_statio_user_tables;

-- Long-running queries
select pid, now() - query_start as duration, query
from pg_stat_activity
where state != 'idle'
  and now() - query_start > interval '5 seconds'
order by duration desc;
```

Check table sizes:
```sql
select * from public.get_table_size_info();
```

### Weekly Database Maintenance

Analyze performance:
```sql
-- Get performance recommendations
select * from public.get_performance_recommendations();

-- Check for unused indexes
select schemaname, tablename, indexname, idx_scan
from pg_stat_user_indexes
where schemaname = 'public'
  and idx_scan = 0
  and indexrelname not like '%_pkey'
order by pg_relation_size(indexrelid) desc;
```

Refresh materialized views:
```sql
select public.refresh_user_stats_summary();
```

Clean up soft-deleted records (>90 days old):
```sql
select public.purge_old_deleted_records('jobs', 90);
select public.purge_old_deleted_records('time_entries', 90);
select public.purge_old_deleted_records('marketing_campaigns', 90);
select public.purge_old_deleted_records('marketing_contacts', 90);
select public.purge_old_deleted_records('marketing_sites', 90);
```

### Database Backup Procedures

Verify latest backup:
- Check Supabase dashboard → Settings → Database → Backups
- Ensure daily backup completed successfully
- Verify PITR window is active (7-30 days)

Create pre-deployment backup:
```bash
# Before major deployments
./scripts/pre-deploy-backup.sh
```

### Database Migration Procedures

Before running migrations:
1. Create pre-migration backup
2. Test migration on staging
3. Review migration for DDL changes
4. Plan for rollback if needed
5. Notify team of potential downtime

Run migrations:
```bash
# Apply all pending migrations
supabase db push

# Or manually via SQL
psql <connection-string> -f supabase/migrations/new_migration.sql
```

After migration:
1. Verify schema changes applied
2. Test affected features
3. Monitor query performance
4. Check for constraint violations
5. Keep backup until verified (24-48 hours)

### Database Recovery Procedures

For accidental data deletion:
1. Check if soft-deleted: `select * from <table> where deleted_at is not null;`
2. Restore if soft-deleted: `select public.restore_record('<table>', '<id>');`
3. If permanently deleted, use point-in-time recovery (see BACKUP_RECOVERY.md)

For migration issues:
1. Restore from pre-deployment backup
2. Revert application deployment
3. Fix migration in staging
4. Re-deploy with fixed migration

For complete database loss:
1. Follow disaster recovery procedures in BACKUP_RECOVERY.md
2. Create new Supabase project
3. Restore from latest backup
4. Update environment variables
5. Redeploy application

### Monitoring Thresholds and Alerts

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Active connections | >80 | >95 | Check connection pool, add PgBouncer |
| Cache hit ratio | <90% | <80% | Tune shared buffers |
| Query time (p95) | >100ms | >500ms | Optimize slow queries |
| Long queries (>5s) | >5 | >20 | Kill or optimize |
| Database size | >50GB | >80GB | Archive old data or partition |
| Table size (single) | >5GB | >10GB | Consider partitioning |
| Backup failures | 1 | 2 | Immediate investigation |

For complete database documentation, see:
- [DATABASE.md](./DATABASE.md) - Complete schema and architecture
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) - Backup and disaster recovery
- [SCALABILITY.md](./SCALABILITY.md) - Scaling to 100k+ users

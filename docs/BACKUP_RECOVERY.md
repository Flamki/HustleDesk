# Backup and Recovery Strategy

## Overview

This document outlines the backup, recovery, and disaster recovery procedures for the HustleDesk Supabase PostgreSQL database. It covers automated backups, point-in-time recovery, and emergency procedures.

## Table of Contents

- [Backup Strategy](#backup-strategy)
- [Supabase Built-in Backups](#supabase-built-in-backups)
- [Custom Backup Procedures](#custom-backup-procedures)
- [Point-in-Time Recovery (PITR)](#point-in-time-recovery-pitr)
- [Disaster Recovery Procedures](#disaster-recovery-procedures)
- [Testing Recovery](#testing-recovery)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Data Retention Policy](#data-retention-policy)

---

## Backup Strategy

### Backup Types

1. **Continuous WAL Archiving** (Supabase automatic)
   - Real-time write-ahead log archiving
   - Enables point-in-time recovery (PITR)
   - Retention: 7-30 days depending on plan

2. **Daily Full Backups** (Supabase automatic)
   - Complete database snapshot
   - Scheduled daily at off-peak hours
   - Retention: 7-30 days depending on plan

3. **Weekly Export Backups** (Manual/scheduled)
   - SQL dump for long-term retention
   - Stored externally (S3/GCS)
   - Retention: 90 days

4. **Pre-deployment Backups** (Manual)
   - Backup before major migrations
   - Kept until deployment verified
   - Enables fast rollback

### Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| WAL Archive | Continuous | 7-30 days | Supabase |
| Full Backup | Daily | 7-30 days | Supabase |
| Export Dump | Weekly | 90 days | External |
| Pre-deploy | Before deploy | 7 days | External |
| Migration | Before migration | 30 days | External |

---

## Supabase Built-in Backups

### Automatic Backups

Supabase provides automatic backups on all paid plans:

**Pro Plan:**
- Daily backups retained for 7 days
- Point-in-time recovery (PITR) for 7 days
- Automatic WAL archiving

**Team/Enterprise Plan:**
- Daily backups retained for 30 days
- Point-in-time recovery (PITR) for 30 days
- Automatic WAL archiving
- Custom backup schedules available

### Accessing Supabase Backups

**Via Dashboard:**
1. Navigate to Supabase Dashboard
2. Select your project
3. Go to Settings → Database → Backups
4. View available backups and PITR timeline
5. Click "Restore" to initiate recovery

**Via CLI:**
```bash
# List available backups
supabase db backups list

# Restore from backup
supabase db restore --backup-id <backup-id>
```

### PITR via Supabase

Point-in-time recovery allows restoring to any moment within retention:

```bash
# Restore to specific timestamp
supabase db restore --timestamp "2026-02-17 14:30:00"
```

---

## Custom Backup Procedures

### Weekly Export Backup

Create a SQL dump for long-term retention:

```bash
#!/bin/bash
# weekly-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/weekly"
BACKUP_FILE="hustledesk_${DATE}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database with pg_dump
pg_dump \
  --host=<supabase-host> \
  --port=5432 \
  --username=postgres \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  --file=- \
  <database-name> | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3/GCS
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://hustledesk-backups/weekly/${BACKUP_FILE}"

# Clean up old local backups (keep 3)
ls -t ${BACKUP_DIR}/*.sql.gz | tail -n +4 | xargs rm -f

echo "Backup completed: ${BACKUP_FILE}"
```

**Schedule via cron:**
```bash
# Run every Sunday at 2 AM
0 2 * * 0 /scripts/weekly-backup.sh >> /var/log/backup.log 2>&1
```

### Pre-deployment Backup

Always backup before major deployments:

```bash
#!/bin/bash
# pre-deploy-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hustledesk_pre_deploy_${DATE}.sql.gz"

pg_dump \
  --host=<supabase-host> \
  --port=5432 \
  --username=postgres \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  <database-name> | gzip > "${BACKUP_FILE}"

aws s3 cp "${BACKUP_FILE}" "s3://hustledesk-backups/pre-deploy/${BACKUP_FILE}"

echo "Pre-deployment backup completed: ${BACKUP_FILE}"
echo "Recovery command: aws s3 cp s3://hustledesk-backups/pre-deploy/${BACKUP_FILE} - | gunzip | psql <connection-string>"
```

### Schema-only Backup

Backup just the schema for version control:

```bash
pg_dump \
  --host=<supabase-host> \
  --username=postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  <database-name> > schema_$(date +%Y%m%d).sql
```

### Data-only Backup (Large Tables)

For selective data backups:

```bash
# Backup specific tables
pg_dump \
  --host=<supabase-host> \
  --username=postgres \
  --data-only \
  --table=time_entries \
  --table=jobs \
  --table=marketing_sends \
  <database-name> | gzip > data_backup_$(date +%Y%m%d).sql.gz
```

---

## Point-in-Time Recovery (PITR)

### Recovery Scenarios

**Scenario 1: Accidental Data Deletion**
- User accidentally deletes important records
- Recovery window: Within PITR retention (7-30 days)

**Scenario 2: Bad Migration**
- Migration corrupts data or breaks application
- Recovery window: Immediately after detection

**Scenario 3: Application Bug**
- Bug writes incorrect data over time
- Recovery window: When bug first introduced

### PITR Procedure

**Via Supabase Dashboard:**
1. Identify the exact timestamp before the incident
2. Navigate to Settings → Database → Backups
3. Click "Point-in-time Recovery"
4. Enter target timestamp
5. Review recovery plan
6. Confirm restoration
7. Wait for recovery to complete (5-30 minutes)
8. Verify data integrity

**Via SQL (Selective Recovery):**

If full recovery is not needed, recover specific records:

```sql
-- 1. Connect to a backup database
-- 2. Query data from backup at specific time

-- Example: Restore deleted jobs
insert into public.jobs
select * from backup.jobs
where id in (
  select id from backup.jobs
  where deleted_at is null
  except
  select id from public.jobs
);
```

### Soft Delete Recovery

For tables with soft delete support:

```sql
-- List recently deleted records
select *
from public.jobs
where deleted_at > now() - interval '7 days'
order by deleted_at desc;

-- Restore a soft-deleted record
select public.restore_record('jobs', '<record-id>');

-- Bulk restore
update public.jobs
set deleted_at = null
where deleted_at > now() - interval '1 day'
  and user_id = '<user-id>';
```

---

## Disaster Recovery Procedures

### Complete Database Loss

**Prerequisites:**
- Latest backup file or Supabase backup ID
- Supabase service role key
- New Supabase project (if needed)

**Recovery Steps:**

1. **Create new Supabase project** (if original is unrecoverable)
   ```bash
   supabase projects create hustledesk-recovery
   ```

2. **Restore from backup**
   ```bash
   # Option A: Restore from Supabase backup
   supabase db restore --backup-id <backup-id>
   
   # Option B: Restore from custom SQL dump
   gunzip -c backup.sql.gz | psql <new-connection-string>
   ```

3. **Run migrations** (if restoring from custom backup)
   ```bash
   supabase db push
   ```

4. **Verify data integrity**
   ```sql
   -- Check record counts
   select 'users' as table_name, count(*) from users
   union all
   select 'jobs', count(*) from jobs
   union all
   select 'time_entries', count(*) from time_entries;
   
   -- Check recent records
   select max(created_at) as latest from users;
   select max(created_at) as latest from jobs;
   ```

5. **Update application configuration**
   - Update `VITE_SUPABASE_URL`
   - Update `VITE_SUPABASE_ANON_KEY`
   - Update `SUPABASE_SERVICE_ROLE_KEY`
   - Redeploy application

6. **Test critical paths**
   - User authentication
   - Job creation
   - Time entry creation
   - Email sending
   - Payment processing

### Partial Data Corruption

**Symptoms:**
- Specific tables have incorrect data
- Constraints violated
- Application errors on specific features

**Recovery:**

1. **Identify corrupted tables**
   ```sql
   -- Check constraints
   select conname, conrelid::regclass, pg_get_constraintdef(oid)
   from pg_constraint
   where contype = 'c'
   order by conrelid::regclass::text;
   
   -- Find constraint violations
   -- (Constraints prevent this, but may occur during migration)
   ```

2. **Restore specific tables from backup**
   ```bash
   # Extract specific table from backup
   pg_restore \
     --table=time_entries \
     --data-only \
     backup.dump | psql <connection-string>
   ```

3. **Verify foreign key consistency**
   ```sql
   -- Check for orphaned records
   select count(*) from time_entries te
   where not exists (select 1 from users u where u.id = te.user_id);
   
   select count(*) from jobs j
   where not exists (select 1 from users u where u.id = j.user_id);
   ```

### Migration Rollback

**If migration fails or causes issues:**

1. **Immediate rollback**
   ```bash
   # Restore from pre-deployment backup
   aws s3 cp s3://hustledesk-backups/pre-deploy/latest.sql.gz - | \
     gunzip | psql <connection-string>
   ```

2. **Revert migration files**
   ```bash
   # Remove failed migration
   rm supabase/migrations/20260217_failed_migration.sql
   
   # Reset database
   supabase db reset
   ```

3. **Re-deploy application** with previous version

---

## Testing Recovery

### Monthly Recovery Test

Test your backup and recovery procedures monthly:

**Test Plan:**

1. **Create test environment**
   ```bash
   supabase projects create hustledesk-test-recovery
   ```

2. **Restore latest backup**
   ```bash
   supabase db restore --backup-id <latest-backup>
   ```

3. **Verify data**
   - Record counts match production
   - Recent records present
   - No constraint violations

4. **Test application functionality**
   - Authentication works
   - CRUD operations work
   - APIs respond correctly

5. **Measure recovery time**
   - Backup to restore: Target < 5 minutes
   - Data verification: Target < 10 minutes
   - Application testing: Target < 15 minutes
   - **Total RTO (Recovery Time Objective): 30 minutes**

6. **Document results**
   ```
   Date: 2026-02-17
   Backup ID: backup_xyz
   Restore Time: 4m 32s
   Data Integrity: ✅ Pass
   Application Test: ✅ Pass
   Issues: None
   ```

7. **Clean up test environment**
   ```bash
   supabase projects delete hustledesk-test-recovery
   ```

### Automated Recovery Tests

**CI/CD pipeline integration:**

```yaml
# .github/workflows/backup-test.yml
name: Monthly Backup Test

on:
  schedule:
    - cron: '0 2 1 * *'  # First day of month, 2 AM

jobs:
  test-recovery:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Supabase CLI
        run: |
          wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb
          sudo dpkg -i supabase_linux_amd64.deb
      
      - name: Create test project
        run: supabase projects create hustledesk-backup-test
      
      - name: Restore latest backup
        run: supabase db restore --backup-id latest
      
      - name: Verify data integrity
        run: |
          psql $TEST_DB_URL -c "SELECT COUNT(*) FROM users;"
          psql $TEST_DB_URL -c "SELECT COUNT(*) FROM jobs;"
      
      - name: Clean up
        run: supabase projects delete hustledesk-backup-test
```

---

## Monitoring and Alerts

### Backup Monitoring

**Key Metrics:**
- Backup success rate
- Backup duration
- Backup file size
- Time since last backup
- PITR coverage window

**Alerts to Configure:**

1. **Backup Failure**
   - Trigger: Backup fails or times out
   - Severity: Critical
   - Action: Immediate investigation

2. **Backup Stale**
   - Trigger: No backup in 25 hours
   - Severity: High
   - Action: Check backup schedule

3. **Backup Size Anomaly**
   - Trigger: Backup size changes >20% from average
   - Severity: Medium
   - Action: Investigate data growth or corruption

4. **PITR Gap**
   - Trigger: PITR coverage < 7 days
   - Severity: High
   - Action: Check WAL archiving

### Monitoring Queries

```sql
-- Check backup freshness (if storing metadata)
select 
  backup_type,
  last_backup_at,
  extract(epoch from (now() - last_backup_at)) / 3600 as hours_since_backup
from backup_metadata
order by last_backup_at desc;

-- Check database size growth
select
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  pg_size_pretty(pg_total_relation_size('public.time_entries')) as time_entries_size,
  pg_size_pretty(pg_total_relation_size('public.marketing_sends')) as marketing_sends_size;

-- Check WAL generation rate (indicator of backup frequency needed)
select
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as wal_generated;
```

---

## Data Retention Policy

### Operational Data

| Data Type | Retention | Cleanup Method |
|-----------|-----------|----------------|
| Active records | Indefinite | User-controlled |
| Soft-deleted records | 90 days | Automatic purge |
| Audit logs | 1 year | Manual archive |
| Activity logs | 6 months | Automatic purge |
| Marketing sends | 2 years | Manual archive |
| Time entries | Indefinite | User-controlled |
| Jobs | Indefinite | User-controlled |

### Backups

| Backup Type | Retention | Storage |
|-------------|-----------|---------|
| Supabase daily | 7-30 days | Supabase |
| Weekly exports | 90 days | External |
| Monthly archives | 1 year | External |
| Pre-deploy | 7 days | External |
| Migration backups | 30 days | External |

### Cleanup Procedures

**Automatic purge of old soft-deleted records:**

```sql
-- Run monthly via cron/pg_cron
select public.purge_old_deleted_records('jobs', 90);
select public.purge_old_deleted_records('time_entries', 90);
select public.purge_old_deleted_records('marketing_campaigns', 90);
select public.purge_old_deleted_records('marketing_contacts', 90);
```

**Archive old audit logs:**

```sql
-- Export logs older than 1 year to cold storage
copy (
  select * from public.audit_logs
  where created_at < now() - interval '1 year'
) to '/backups/audit_archive_2025.csv' with csv header;

-- Delete archived logs
delete from public.audit_logs
where created_at < now() - interval '1 year';
```

**Clean up old activity logs:**

```sql
-- Delete activity logs older than 6 months
delete from public.user_activity_log
where created_at < now() - interval '6 months';
```

**Schedule with pg_cron:**

```sql
-- Install pg_cron extension (if available)
create extension if not exists pg_cron;

-- Schedule monthly cleanup (1st day at 3 AM)
select cron.schedule(
  'cleanup-soft-deleted',
  '0 3 1 * *',
  $$
    select public.purge_old_deleted_records('jobs', 90);
    select public.purge_old_deleted_records('time_entries', 90);
    select public.purge_old_deleted_records('marketing_campaigns', 90);
  $$
);

-- Schedule audit log archival (yearly)
select cron.schedule(
  'archive-audit-logs',
  '0 2 1 1 *',
  $$
    -- Archive and delete logs older than 1 year
    -- (Implement export logic here)
  $$
);
```

---

## Emergency Contacts

### Team Responsibilities

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Database Admin | TBD | TBD | Backup/restore, PITR |
| DevOps Lead | TBD | TBD | Infrastructure, Supabase |
| Backend Lead | TBD | TBD | Data integrity, migrations |
| On-call Engineer | TBD | TBD | After-hours incidents |

### Escalation Path

1. **On-call engineer** - First responder (5 min)
2. **Database Admin** - Backup/recovery (15 min)
3. **DevOps Lead** - Infrastructure issues (30 min)
4. **CTO/Director** - Major incidents (1 hour)

### External Support

- **Supabase Support**: support@supabase.io
- **Supabase Dashboard**: https://app.supabase.com
- **Status Page**: https://status.supabase.com

---

## Recovery Playbooks

### Playbook 1: Accidental Data Deletion

1. **Confirm incident**
   - What was deleted?
   - When did it happen?
   - How many records affected?

2. **Check soft delete**
   ```sql
   select * from jobs where deleted_at is not null;
   select public.restore_record('jobs', '<id>');
   ```

3. **If permanently deleted, use PITR**
   - Identify timestamp before deletion
   - Use Supabase dashboard to restore
   - Or restore specific table from backup

4. **Verify recovery**
   - Check record counts
   - Test affected functionality
   - Notify user

### Playbook 2: Bad Migration

1. **Stop deployment immediately**
2. **Assess damage**
   - What changed?
   - Is data corrupted or just schema?
3. **Restore from pre-deployment backup**
   ```bash
   aws s3 cp s3://hustledesk-backups/pre-deploy/latest.sql.gz - | \
     gunzip | psql <connection-string>
   ```
4. **Revert application deployment**
5. **Fix migration**
6. **Test in staging**
7. **Re-deploy with fixed migration**

### Playbook 3: Complete Database Loss

1. **Verify database is truly unrecoverable**
2. **Create new Supabase project**
3. **Restore from latest backup**
4. **Run all migrations**
5. **Update environment variables**
6. **Deploy application**
7. **Verify all functionality**
8. **Communicate to users (if downtime)**

---

## Best Practices

1. **Always backup before migrations**
2. **Test restore procedures monthly**
3. **Keep multiple backup copies** (Supabase + external)
4. **Monitor backup success rates**
5. **Document all recovery procedures**
6. **Practice disaster recovery scenarios**
7. **Automate backup verification**
8. **Encrypt backups at rest and in transit**
9. **Regularly test point-in-time recovery**
10. **Maintain audit trail of all restores**

---

## Compliance

### GDPR Right to Erasure

When users request data deletion:

1. **Soft delete user data**
   ```sql
   update users set deleted_at = now() where id = '<user-id>';
   ```

2. **After 30-day waiting period, hard delete**
   ```sql
   delete from users where id = '<user-id>';
   -- Cascades to all related tables
   ```

3. **Remove from backups** (if required)
   - Note: Full backup purge not typically required
   - User data will age out with backup retention

### Data Residency

- Supabase region: [Specify region, e.g., US East, EU West]
- Backup storage region: [Specify region]
- Ensure compliance with data residency requirements

---

## Appendix: Useful Commands

### Database Size

```sql
-- Total database size
select pg_size_pretty(pg_database_size(current_database()));

-- Largest tables
select
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
from pg_tables
where schemaname = 'public'
order by pg_total_relation_size(schemaname||'.'||tablename) desc
limit 10;
```

### Connection Info

```sql
-- Active connections
select count(*) from pg_stat_activity;

-- Connection details
select
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query_start
from pg_stat_activity
where datname = current_database();
```

### Backup Verification

```bash
# Verify SQL dump integrity
gunzip -t backup.sql.gz

# Check backup file size
ls -lh backup.sql.gz

# Preview backup contents
gunzip -c backup.sql.gz | head -100
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-17  
**Next Review:** 2026-05-17

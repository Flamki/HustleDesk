# Database Scalability Guide

## Overview

This document outlines the scalability strategy for the HustleDesk database to support growth from 1,000 to 100,000+ users. It covers performance optimization, capacity planning, and scaling techniques.

## Table of Contents

- [Current State](#current-state)
- [Scaling Milestones](#scaling-milestones)
- [Performance Optimization](#performance-optimization)
- [Connection Pooling](#connection-pooling)
- [Query Optimization](#query-optimization)
- [Table Partitioning](#table-partitioning)
- [Caching Strategy](#caching-strategy)
- [Read Replicas](#read-replicas)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Capacity Planning](#capacity-planning)

---

## Current State

### Architecture

- **Database**: Supabase PostgreSQL 15+
- **Expected Load**:
  - Current: ~100 users
  - 12-month target: 10,000 users
  - 24-month target: 100,000 users

### Current Metrics (Baseline)

| Metric | Current | Target (100k users) |
|--------|---------|---------------------|
| Total tables | 21 | 21 |
| Largest table | time_entries (~1k rows) | time_entries (~10M rows) |
| Database size | <100 MB | 50-100 GB |
| Queries/second | <10 | 500-1000 |
| Avg query time | <50ms | <100ms |
| Concurrent connections | 5-10 | 100-200 |

---

## Scaling Milestones

### Phase 1: 0-1,000 Users (Current)

**Database Configuration:**
- Single Supabase database
- Default connection pool (10-20)
- No partitioning
- Standard indexes

**Key Actions:**
- ✅ Implement comprehensive indexes
- ✅ Enable RLS on all tables
- ✅ Add audit logging
- ✅ Set up monitoring

**Expected Performance:**
- Query time: <50ms p95
- Database size: <500 MB
- Connections: 10-20 concurrent

---

### Phase 2: 1,000-10,000 Users (6-12 months)

**Database Configuration:**
- Upgrade Supabase plan (Pro → Team)
- PgBouncer for connection pooling
- Materialized views for dashboards
- Covering indexes for hot queries

**Key Actions:**
- [ ] Implement PgBouncer connection pooling
- [ ] Create materialized views
- [ ] Optimize slow queries (>100ms)
- [ ] Add query performance monitoring
- [ ] Enable Supabase read replicas

**Expected Performance:**
- Query time: <100ms p95
- Database size: 5-10 GB
- Connections: 50-100 concurrent
- Read replica lag: <5s

**Scaling Triggers:**
- Query time >100ms p95
- Database size >5 GB
- Connection pool exhaustion
- Table scan times >1s

---

### Phase 3: 10,000-50,000 Users (12-18 months)

**Database Configuration:**
- Supabase Team/Enterprise plan
- Multiple read replicas (2-3)
- Table partitioning for large tables
- Advanced connection pooling strategy
- Aggressive caching layer

**Key Actions:**
- [ ] Partition time_entries by month
- [ ] Partition marketing_sends by month
- [ ] Partition audit_logs by month
- [ ] Add Redis caching layer
- [ ] Implement write-through cache for hot data
- [ ] Add CDN for static assets
- [ ] Optimize autovacuum settings

**Expected Performance:**
- Query time: <100ms p95
- Database size: 20-50 GB
- Connections: 100-200 concurrent
- Cache hit rate: >80%
- Read replica lag: <3s

**Scaling Triggers:**
- Single table >10M rows
- Database size >20 GB
- Read replica lag >5s
- Cache miss rate >30%

---

### Phase 4: 50,000-100,000+ Users (18-24 months)

**Database Configuration:**
- Supabase Enterprise plan
- Multiple read replicas (3-5)
- Full table partitioning strategy
- Dedicated analytics database
- Multi-region deployment (if needed)

**Key Actions:**
- [ ] Full partitioning implementation
- [ ] Separate analytics database
- [ ] Implement CQRS pattern for heavy reads
- [ ] Archive old data to cold storage
- [ ] Multi-region setup (if global)
- [ ] Dedicated connection pools per service

**Expected Performance:**
- Query time: <100ms p95
- Database size: 50-100 GB
- Connections: 200-500 concurrent
- Cache hit rate: >90%
- Read replica lag: <2s
- Analytics queries: <5s

---

## Performance Optimization

### Index Strategy

**Already Implemented:**
- ✅ Single-column indexes on foreign keys
- ✅ Composite indexes for common queries
- ✅ Partial indexes for filtered queries
- ✅ Covering indexes for heavy queries
- ✅ GIN indexes for array/JSONB searches

**Best Practices:**
```sql
-- Check index usage
select
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
from pg_stat_user_indexes
where schemaname = 'public'
order by idx_scan desc;

-- Identify missing indexes
select * from public.get_performance_recommendations();

-- Find unused indexes
select
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
from pg_stat_user_indexes
where schemaname = 'public'
  and idx_scan = 0
  and indexrelname not like '%_pkey'
order by pg_relation_size(indexrelid) desc;
```

### Query Optimization

**Slow Query Monitoring:**

```sql
-- Enable slow query logging (Supabase dashboard)
-- Or check pg_stat_statements

select
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

**Common Optimizations:**

1. **Use prepared statements** - Reduce parsing overhead
2. **Batch operations** - INSERT/UPDATE multiple rows at once
3. **Use EXISTS instead of COUNT** - Exit early when found
4. **Limit result sets** - Always use LIMIT in lists
5. **Avoid SELECT \*** - Select only needed columns
6. **Use covering indexes** - Avoid table lookups

**Example Optimizations:**

```sql
-- BEFORE (slow)
select count(*) > 0 from jobs where user_id = '<user-id>';

-- AFTER (fast)
select exists(select 1 from jobs where user_id = '<user-id>');

-- BEFORE (slow)
select * from time_entries where user_id = '<user-id>' order by start_time desc;

-- AFTER (fast, with limit)
select id, start_time, client, project, duration_seconds, earnings
from time_entries
where user_id = '<user-id>'
order by start_time desc
limit 50;

-- Use covering index to avoid table access
-- Index: idx_time_entries_user_date_covering
```

### Materialized Views

**Already Implemented:**
- ✅ `user_stats_summary` - Dashboard aggregations

**Refresh Strategy:**

```sql
-- Refresh hourly via cron
select public.refresh_user_stats_summary();

-- Check freshness
select max(refreshed_at) from user_stats_summary;

-- Use concurrently to avoid blocking
refresh materialized view concurrently user_stats_summary;
```

**Additional Views to Consider:**

```sql
-- Marketing performance summary
create materialized view marketing_performance_summary as
select
  user_id,
  count(distinct campaign_id) as total_campaigns,
  count(*) as total_sends,
  count(case when status = 'sent' then 1 end) as successful_sends,
  count(case when status = 'failed' then 1 end) as failed_sends,
  round(
    100.0 * count(case when status = 'sent' then 1 end) / nullif(count(*), 0),
    2
  ) as success_rate
from marketing_sends
group by user_id;

-- Time tracking summary by client
create materialized view time_tracking_by_client as
select
  user_id,
  client,
  count(*) as entry_count,
  sum(duration_seconds) as total_seconds,
  sum(earnings) as total_earnings,
  max(start_time) as last_entry
from time_entries
where deleted_at is null
group by user_id, client;
```

---

## Connection Pooling

### PgBouncer Configuration

**Connection Pool Sizing:**

Formula: `pool_size = (CPU_cores × 2) + 1`

For 4-core database: `(4 × 2) + 1 = 9 connections`

**PgBouncer Setup:**

```ini
[databases]
hustledesk = host=<supabase-host> port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
```

**Pool Modes:**

- **Transaction mode** (recommended): Connection released after transaction
- **Session mode**: Connection held for entire session
- **Statement mode**: Connection released after each statement

### Application Connection Pooling

**Supabase Client Configuration:**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // Serverless
    },
    global: {
      headers: {
        'x-connection-pool': 'enabled',
      },
    },
  }
);
```

**Monitor Connections:**

```sql
-- Active connections
select
  datname,
  count(*) as connections,
  max(state) as state
from pg_stat_activity
where datname = 'postgres'
group by datname;

-- Connection states
select
  state,
  count(*)
from pg_stat_activity
group by state;

-- Long-running queries
select
  pid,
  now() - pg_stat_activity.query_start as duration,
  query,
  state
from pg_stat_activity
where state != 'idle'
  and now() - pg_stat_activity.query_start > interval '5 seconds';
```

---

## Query Optimization

### Explain Analyze

Always use `EXPLAIN ANALYZE` for slow queries:

```sql
explain analyze
select j.*, u.email
from jobs j
join users u on u.id = j.user_id
where j.user_id = '<user-id>'
  and j.status = 'applied'
  and j.deleted_at is null
order by j.created_at desc
limit 10;
```

**Look for:**
- Sequential scans (should use indexes)
- High cost operations
- Nested loop joins (consider hash join)
- Sorts on large datasets

### Query Patterns

**Efficient Pagination:**

```sql
-- Cursor-based pagination (efficient)
select * from jobs
where user_id = '<user-id>'
  and created_at < '<cursor-date>'
order by created_at desc
limit 20;

-- Offset pagination (avoid for large offsets)
-- select * from jobs limit 20 offset 1000; -- SLOW
```

**Efficient Aggregations:**

```sql
-- Use materialized views for expensive aggregations
select * from user_stats_summary where user_id = '<user-id>';

-- Instead of live aggregation
-- select count(*) from jobs where user_id = '<user-id>'; -- Can be slow
```

**Efficient Existence Checks:**

```sql
-- Fast
select exists(select 1 from jobs where user_id = '<user-id>');

-- Slow
select count(*) > 0 from jobs where user_id = '<user-id>';
```

---

## Table Partitioning

### When to Partition

Partition when:
- Table >10M rows
- Query performance degrades
- Maintenance (VACUUM) takes too long
- Archival/deletion of old data needed

### Partitioning Strategy

**Time-series tables** (partition by month):
- `time_entries` - Partition by `start_time`
- `marketing_sends` - Partition by `created_at`
- `audit_logs` - Partition by `created_at`
- `user_activity_log` - Partition by `created_at`

**Implementation:**

```sql
-- 1. Create partitioned table (new table)
create table time_entries_partitioned (
  like time_entries including all
) partition by range (start_time);

-- 2. Create partitions for each month
create table time_entries_y2026m01 partition of time_entries_partitioned
  for values from ('2026-01-01') to ('2026-02-01');

create table time_entries_y2026m02 partition of time_entries_partitioned
  for values from ('2026-02-01') to ('2026-03-01');

-- 3. Migrate data (in batches)
insert into time_entries_partitioned
select * from time_entries
where start_time >= '2026-01-01'
  and start_time < '2026-02-01';

-- 4. Rename tables (requires downtime)
begin;
  alter table time_entries rename to time_entries_old;
  alter table time_entries_partitioned rename to time_entries;
commit;

-- 5. Update RLS policies (automatic)
-- 6. Drop old table after verification
drop table time_entries_old;
```

**Automated Partition Creation:**

```sql
-- Use function from migration
select public.create_monthly_partition('time_entries', 'start_time', '2026-03-01');

-- Schedule monthly (via pg_cron)
select cron.schedule(
  'create-next-month-partitions',
  '0 0 25 * *',  -- 25th of each month
  $$
    select public.create_monthly_partition('time_entries', 'start_time', date_trunc('month', now() + interval '1 month'));
    select public.create_monthly_partition('marketing_sends', 'created_at', date_trunc('month', now() + interval '1 month'));
  $$
);
```

### Partition Maintenance

**Drop old partitions** (archive old data):

```sql
-- Archive partition to external storage first
\copy time_entries_y2024m01 to '/backups/time_entries_2024_01.csv' csv header;

-- Drop partition
drop table time_entries_y2024m01;
```

---

## Caching Strategy

### Application-level Caching

**Redis Cache:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache user profile
async function getUserProfile(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}
```

**Cache Invalidation:**

```typescript
// Invalidate on update
async function updateUserProfile(userId: string, updates: any) {
  await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
  
  // Invalidate cache
  await redis.del(`user:${userId}`);
}
```

### Database Query Cache

**PostgreSQL Shared Buffers:**

```sql
-- Check cache hit ratio (should be >90%)
select
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
from pg_statio_user_tables;
```

### CDN Caching

**Static Assets:**
- Public marketing sites
- Portfolio images
- User avatars

**Cache Headers:**
```typescript
// Public site endpoint
res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
```

---

## Read Replicas

### When to Use Read Replicas

- Read:Write ratio >3:1
- Dashboard queries impacting write performance
- Analytics queries needed
- Multi-region deployment

### Supabase Read Replicas

**Setup:**
1. Enable read replicas in Supabase dashboard
2. Get read replica connection string
3. Configure application to use replica for reads

**Application Configuration:**

```typescript
// Write client (primary)
const supabasePrimary = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read client (replica)
const supabaseReplica = createClient(
  process.env.SUPABASE_READ_REPLICA_URL,
  process.env.SUPABASE_ANON_KEY
);

// Use replica for reads
async function getUserJobs(userId: string) {
  const { data } = await supabaseReplica
    .from('jobs')
    .select('*')
    .eq('user_id', userId);
  return data;
}

// Use primary for writes
async function createJob(userId: string, jobData: any) {
  const { data } = await supabasePrimary
    .from('jobs')
    .insert({ user_id: userId, ...jobData });
  return data;
}
```

**Monitor Replication Lag:**

```sql
-- On primary
select
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  sync_state,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) as lag_bytes
from pg_stat_replication;
```

---

## Monitoring and Alerts

### Key Metrics

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Query time (p95) | >100ms | >500ms | Optimize queries |
| Connection pool | >80% | >95% | Increase pool |
| Database size | >50GB | >80GB | Archive/partition |
| Cache hit ratio | <90% | <80% | Tune buffers |
| Replication lag | >5s | >30s | Check network |
| Disk usage | >80% | >90% | Add storage |
| CPU usage | >70% | >90% | Scale up |
| Long queries | >5s | >30s | Kill/optimize |

### Monitoring Queries

```sql
-- Database health check
select
  'database_size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

select
  'largest_table' as metric,
  tablename as table_name,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as value
from pg_tables
where schemaname = 'public'
order by pg_total_relation_size('public.' || tablename) desc
limit 1;

-- Performance metrics
select
  'cache_hit_ratio' as metric,
  round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) as value
from pg_statio_user_tables;

select
  'active_connections' as metric,
  count(*) as value
from pg_stat_activity
where state = 'active';
```

### Alert Configuration

**Supabase Dashboard:**
- Set up email alerts for critical metrics
- Monitor slow query log
- Track connection pool usage

**External Monitoring:**
- Datadog / New Relic / Grafana
- Custom metrics from queries above
- Alert on thresholds

---

## Capacity Planning

### Growth Projections

| Users | Time Entries/day | Marketing Sends/day | DB Size | IOPS |
|-------|------------------|---------------------|---------|------|
| 1,000 | 500 | 1,000 | 500 MB | 100 |
| 10,000 | 5,000 | 10,000 | 10 GB | 500 |
| 50,000 | 25,000 | 50,000 | 50 GB | 2,000 |
| 100,000 | 50,000 | 100,000 | 100 GB | 5,000 |

### Storage Growth

**Formula:**
```
Daily growth = (time_entries + marketing_sends + audit_logs) × avg_row_size
Monthly growth = daily_growth × 30
```

**Example (10,000 users):**
```
Time entries: 5,000/day × 500 bytes = 2.5 MB/day = 75 MB/month
Marketing sends: 10,000/day × 300 bytes = 3 MB/day = 90 MB/month
Audit logs: 10,000/day × 400 bytes = 4 MB/day = 120 MB/month
Total: ~300 MB/month
Annual: ~3.6 GB/year
```

### Scaling Budget

| Phase | Users | Supabase Plan | Monthly Cost | Database |
|-------|-------|---------------|--------------|----------|
| 1 | 0-1k | Pro | $25 | 8GB RAM, 2 CPU |
| 2 | 1k-10k | Team | $599 | 16GB RAM, 4 CPU |
| 3 | 10k-50k | Team + | $1,299 | 32GB RAM, 8 CPU |
| 4 | 50k-100k | Enterprise | Custom | Custom |

---

## Best Practices

1. **Index all foreign keys** ✅
2. **Use composite indexes for common queries** ✅
3. **Implement connection pooling** (PgBouncer)
4. **Cache expensive queries** (Redis)
5. **Use materialized views for dashboards** ✅
6. **Partition large tables** (when >10M rows)
7. **Monitor slow queries** (>100ms)
8. **Use read replicas for analytics**
9. **Archive old data** (cold storage)
10. **Regular VACUUM and ANALYZE**

---

## Troubleshooting

### Slow Queries

```sql
-- Find slow queries
select * from pg_stat_statements
where mean_exec_time > 100
order by mean_exec_time desc;

-- Kill long-running query
select pg_terminate_backend(pid)
from pg_stat_activity
where pid = <pid>;
```

### Connection Pool Exhausted

```sql
-- Check connections
select count(*) from pg_stat_activity;

-- Increase pool size or add PgBouncer
```

### High CPU Usage

```sql
-- Find expensive queries
select * from pg_stat_statements
order by total_exec_time desc
limit 10;

-- Optimize or cache these queries
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-17  
**Next Review:** 2026-05-17

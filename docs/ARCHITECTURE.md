# Architecture

## Overview
GetSoloDesk is a hybrid Vite app (SSG + SPA) with serverless APIs and Supabase as system of record.

Core layers:
- Frontend SPA (`pages/`, `components/`, `services/`)
- API layer (`api/**/*.js`) deployed as Vercel Functions
- Supabase Postgres/Auth storage and authorization
- External providers (Stripe, Resend, Upstash Redis)

## Runtime Model
- Public marketing routes are statically generated (SSG) and app routes are client-rendered under `/app/*`.
- Frontend calls same-origin APIs at `/api/*`.
- API functions use Supabase anon token (user-context) or service role key (system-context), depending on endpoint behavior.

## Frontend
- Entry: `src/main.tsx`
- Router and route lazy-loading: `App.tsx`
- Auth/session context: `context/AuthContext.tsx`
- Website builder UIs:
  - Portfolio builder: `components/builder/PortfolioBuilder.tsx`
  - Link in bio builder: `components/linkbioBuilder/LinkBioBuilder.tsx`
- Public rendered pages:
  - `pages/PublicSitePage.tsx`

Performance strategies:
- Route-level React lazy chunks
- Static pre-rendering for SEO routes with `vite-react-ssg`
- Hover/idle prefetch for heavy builder modules
- Lazy image decoding hints for template-heavy pages

## API Layer
- Folder: `api/`
- Style: request-level handler functions (Node runtime)
- Auth patterns:
  - User-auth endpoints: bearer token -> Supabase `auth.getUser()`
  - Public endpoints: input validation + lookup by slug/token
  - Admin/service actions: Supabase service role key

Key domains:
- `api/jobs/*` jobs pipeline
- `api/time-entries/*` time tracking
- `api/marketing/*` campaigns, contacts, sites
- `api/public/*` public site read/write events
- `api/payments/*` Stripe checkout, portal, webhooks

## Data Layer (Supabase)

### Database Architecture
- **Database**: PostgreSQL 15+ via Supabase
- **Migrations**: SQL files in `supabase/migrations/`
- **RLS**: Row Level Security enabled on all tables
- **Soft Deletes**: Implemented on major tables (jobs, time_entries, campaigns, contacts, sites)
- **Audit Logging**: Automatic change tracking for critical tables
- **Analytics**: User activity logging and pre-aggregated metrics

### Schema Overview
- **21 tables** organized into domains:
  - **Core**: users, freelancer_profiles
  - **Jobs**: jobs pipeline with status tracking
  - **Time Tracking**: time_entries with shareable links
  - **Marketing**: contacts, campaigns, sends, sites, portfolio items
  - **Analytics**: audit_logs, user_activity_log, usage_metrics
  - **Settings**: notification_settings, client_segmentation_settings, template_overrides
  - **Public**: email_subscriptions, marketing_site_signups, marketing_site_events

### Performance Features
- **85+ indexes**: Single-column, composite, covering, partial, and GIN indexes
- **Materialized views**: Pre-aggregated user statistics (user_stats_summary)
- **Connection pooling**: Ready for PgBouncer integration
- **Query optimization**: Covering indexes, table clustering, autovacuum tuning
- **Scalability**: Prepared for table partitioning at 10M+ rows

### Security & Compliance
- **Row Level Security**: All tables protected with user-scoped policies
- **Audit trail**: Automatic logging of INSERT/UPDATE/DELETE operations
- **Soft deletes**: 90-day retention with recovery functions
- **Data validation**: 50+ CHECK constraints for email, URL, numeric, date, and format validation
- **Backup strategy**: Daily automated backups + 7-30 day PITR

### Data Relationships
- All user data cascades on user deletion (GDPR compliance)
- Marketing website model enforces max one site per kind (`link_in_bio`, `portfolio`) per user
- Time entries optionally link to jobs (set null on job deletion)
- Marketing sends link to campaigns and contacts (cascade delete)

For detailed documentation:
- [DATABASE.md](./DATABASE.md) - Complete schema, indexes, RLS policies, constraints
- [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) - Backup procedures and disaster recovery
- [SCALABILITY.md](./SCALABILITY.md) - Scaling strategy for 100k+ users

## Cost and Protection Controls
- Vercel static cache for hashed assets
- Public site read endpoint edge cache
- Global rate limiting via Upstash on expensive endpoints:
  - `POST /api/marketing/send`
  - `POST /api/public/site-event`
- In-memory limiter fallback if Upstash is unavailable

## Reliability and Guardrails
- Startup environment validation guard to prevent broken runtime boots
- Centralized error responses in API handlers
- Deployment checklist and load test scripts in repo


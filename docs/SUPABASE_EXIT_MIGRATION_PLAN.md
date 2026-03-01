# Supabase Exit Migration Plan

Last updated: March 1, 2026

## Objective

Replace Supabase dependencies (Auth + PostgREST + client SDK assumptions) with a ban-resilient architecture that keeps the app reachable even if any single backend vendor domain is blocked.

## Reality Check

- There is no provider that can be guaranteed "never blocked anywhere".
- The safest pattern is:
  - Keep user-facing traffic on your own domain.
  - Keep core auth and API on your own domain.
  - Avoid browser calls to vendor domains.
  - Keep data export + failover ready at all times.

## Recommended Target Architecture

1. API/Auth: Self-hosted on your domain (`api.yourdomain.com` or `/api/*` in current app)
2. Database: Managed PostgreSQL in India region (AWS RDS/Aurora Mumbai `ap-south-1` or Hyderabad `ap-south-2`)
3. Auth: Better Auth (or Auth.js) running inside your API service
4. Storage: S3-compatible object storage with custom domain (Cloudflare R2 or S3 + CloudFront)
5. Email: keep Resend
6. Billing: keep Stripe
7. Rate limiting: Upstash (current) or Redis in same cloud/VPC for full control

## Why This Over "Neon Only"

- Neon is strong for Postgres, but currently no India region listed in Neon regions docs.
- Neon Auth has recent/ongoing beta history and product evolution.
- For regulatory/network resilience in India, owning API/Auth on your domain with India-region DB is lower risk than relying on a single external platform endpoint.

Neon can still be used as an interim DB option if you want speed, but it should sit behind your own API domain and not be directly exposed to browser clients.

## Current Supabase Coupling in This Repo

### Frontend

- `services/supabaseClient.ts`
- `services/supabaseService.ts`
- `services/timeTrackerService.ts`
- `services/timeShareService.ts`
- `services/timeEntryShareService.ts`
- `services/templatesService.ts`
- `services/marketingWebsiteService.ts`

### Server API (direct `@supabase/supabase-js`)

- Most handlers under `server/api/**` (jobs, dashboard, time, marketing, auth, public, notifications, clients, payments shared)

### Database

- Schema + policies in `supabase/migrations/**` must be ported to standard PostgreSQL migration flow.

## Migration Phases

## Phase 0 - Stabilize and Freeze

1. Keep current `/api/sb/*` proxy workaround active.
2. Freeze schema changes except migration work.
3. Add full backup and restore rehearsal from Supabase.

Exit criteria:

- Daily export/restore drill is successful.

## Phase 1 - New Backend Foundation

1. Stand up PostgreSQL in India region.
2. Create a new migration pipeline (Prisma/Drizzle/Knex/Flyway; choose one and standardize).
3. Port schema from `supabase/migrations/**`:
   - tables, indexes, constraints, triggers.
4. Replace Supabase-specific RLS assumptions with app-layer ownership checks or equivalent PostgreSQL RLS using app claims.

Exit criteria:

- New DB schema matches required app behavior in staging.

## Phase 2 - Auth Cutover

1. Implement Better Auth/Auth.js in API service:
   - email/password
   - verification
   - Google OAuth
   - session handling
2. Replace frontend session bootstrap in:
   - `context/AuthContext.tsx`
   - `services/supabaseService.ts` auth calls
3. Add token/cookie verification middleware for `server/api/**`.

Exit criteria:

- Login/signup/verification/OAuth work without Supabase Auth.

## Phase 3 - API Data Layer Replacement

1. Add provider-neutral data access layer:
   - repositories for jobs, time entries, marketing, templates, profile, analytics.
2. Replace direct Supabase queries in `server/api/**` with repository calls.
3. Keep endpoint contracts unchanged to avoid frontend breakage.

Exit criteria:

- All `/api/*` routes pass integration tests against new DB/auth.

## Phase 4 - Frontend Service Refactor

1. Remove direct browser Supabase dependency:
   - no `@supabase/supabase-js` in browser runtime.
2. Convert services to API-only calls:
   - `services/supabaseService.ts` -> `services/apiService.ts` (or modular domain services)
3. Remove Supabase env requirements from client except transitional flags.

Exit criteria:

- Frontend runs with zero direct Supabase client usage.

## Phase 5 - Parallel Run and Cutover

1. Dual-write critical entities for limited period (jobs/time/contacts).
2. Compare row counts/checksums and business metrics.
3. Switch read path to new backend.
4. Keep rollback path for 7-14 days.

Exit criteria:

- Production traffic stable on new backend for 14 days.

## Phase 6 - Decommission Supabase

1. Disable Supabase writes.
2. Archive final snapshot.
3. Remove Supabase keys and SDK from codebase.
4. Close incident playbook.

Exit criteria:

- No Supabase runtime dependency remains.

## Work Breakdown (Repo-Specific)

## A. Immediate Refactors

1. Create `server/api/_shared/auth.js` middleware independent of Supabase.
2. Create `server/data/*` repositories and move query logic out of handlers.
3. Split `services/supabaseService.ts` into domain services + API transport.

## B. Auth-EndPoints to Rebuild

1. `server/api/auth/setup-profile.js`
2. `server/api/auth/resend-verification.js`
3. `server/api/auth/verify-email.js`
4. `context/AuthContext.tsx` + auth flows in `services/supabaseService.ts`

## C. High-Risk Feature Areas

1. Payments webhooks and subscription sync (`server/api/payments/**`)
2. Public marketing ingestion endpoints (`server/api/public/site-signup.js`, `site-event.js`)
3. Time-sharing public tokens (`server/api/public/time-share.js`, `time-entry.js`)

## Testing Strategy

1. Add contract tests for every `/api/*` response shape before rewriting internals.
2. Expand integration tests for:
   - auth lifecycle
   - jobs CRUD + status transitions
   - time entry CRUD + share links
   - marketing send and unsubscribe
3. Add migration verification scripts:
   - row count diffs
   - spot-check queries
   - checksum by day/user for high-volume tables

## Rollback Plan

1. Keep Supabase proxy mode deployable until final decommission.
2. Feature flag read/write provider (`DB_PROVIDER=supabase|postgres` during transition).
3. If severe issue:
   - switch reads back to Supabase
   - replay queued writes if dual-write enabled

## Decision Needed From You

Pick one target path now:

1. Recommended: India-region Postgres (RDS/Aurora) + Better Auth
2. Faster interim: Neon + Better Auth, still behind your own API domain
3. Managed auth vendor (Clerk/Auth0) + Postgres (fastest auth setup, higher vendor risk)

Until that choice is made, we should not start irreversible auth and schema rewrites.

# Architecture

## Overview
HustleDesk is a Vite SPA with serverless APIs and Supabase as system of record.

Core layers:
- Frontend SPA (`pages/`, `components/`, `services/`)
- API layer (`api/**/*.js`) deployed as Vercel Functions
- Supabase Postgres/Auth storage and authorization
- External providers (Stripe, Resend, Upstash Redis)

## Runtime Model
- Client routes are hash-based (`/#/...`) to keep static hosting simple.
- Frontend calls same-origin APIs at `/api/*`.
- API functions use Supabase anon token (user-context) or service role key (system-context), depending on endpoint behavior.

## Frontend
- Entry: `index.tsx`
- Router and route lazy-loading: `App.tsx`
- Auth/session context: `context/AuthContext.tsx`
- Website builder UIs:
  - Portfolio builder: `components/builder/PortfolioBuilder.tsx`
  - Link in bio builder: `components/linkbioBuilder/LinkBioBuilder.tsx`
- Public rendered pages:
  - `pages/PublicSitePage.tsx`

Performance strategies:
- Route-level React lazy chunks
- Manual vendor chunking in `vite.config.ts`
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
- SQL migrations: `supabase/migrations/`
- RLS enabled tables with user-bound access policies
- Marketing website model enforces max one site per kind (`link_in_bio`, `portfolio`) per user.

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

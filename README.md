# GetSoloDesk

GetSoloDesk is a freelancer operations platform built with React + Vite + Supabase + Vercel serverless APIs.
It uses a hybrid rendering model:
- Public marketing pages are statically generated (SEO-ready).
- Private product pages under `/app/*` are client-rendered.

It combines:
- CRM-style job pipeline and dashboard
- Time tracking with shareable client reports
- Proposal generation and template management
- Email marketing + public site builder (portfolio + link in bio)
- Billing (Stripe), analytics, and account settings

## Tech Stack
- Frontend: React 19, React Router, Tailwind CSS, Vite
- Backend: Vercel Serverless Functions (`api/**/*.js`)
- Data/Auth: Supabase (Postgres + Auth + RLS)
- Billing: Stripe
- Email: Resend
- Optional global rate limiting: Upstash Redis

## Project Structure
- `pages/` app screens and route pages
- `components/` UI, builder, marketing, and layout modules
- `services/` frontend API/service clients
- `api/` serverless endpoints
- `supabase/migrations/` SQL migrations
- `docs/` architecture, API, deployment and operations docs

## Getting Started

1. Install dependencies
```bash
npm install
```

2. Create local env file
```bash
cp .env.example .env.local
```
Then fill values in `.env.local`.

3. Start local app + API
```bash
npm run dev
```

4. Open app
- `http://localhost:5173`

## Environment Variables

Core:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HEALTHCHECK_TOKEN`

Notes:
- `VITE_SUPABASE_URL` supports direct mode (`https://<project-ref>.supabase.co`) and proxy mode (`https://<your-domain>/api/sb`).
- In proxy mode, keep `SUPABASE_URL` pointed to the real Supabase project URL on the server.

Billing:
- `APP_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO_MONTHLY`

Marketing:
- `PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `MARKETING_FROM_EMAIL`
- `MARKETING_FROM_NAME`

AI:
- `FIREWORKS_API_KEY`
- `FIREWORKS_MODEL` (optional override)
- `FIREWORKS_BASE_URL` (optional override)

Rate Limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

See `.env.example` for the complete template.

## Scripts
- `npm run dev` start web + local API runner
- `npm run dev:web` start Vite only
- `npm run dev:api` start API runner only
- `npm test` run tests in watch mode
- `npm run test:ui` run tests with UI
- `npm run test:run` run tests once
- `npm run test:coverage` run tests with coverage report
- `npm run lint` run ESLint
- `npm run lint:fix` run ESLint with auto-fix
- `npm run typecheck` TypeScript validation
- `npm run build` production build
- `npm run ci` run all checks (lint + typecheck + test + build)
- `npm run release:patch` version bump + tag + push
- `npm run release:minor` version bump + tag + push
- `npm run release:major` version bump + tag + push
- `npm run preview` serve built app locally
- `npm run merge-conflict-resolver` resolve Git merge conflicts intelligently
- `npm run loadtest:jobs` load test job endpoints
- `npm run loadtest:dashboard` load test dashboard
- `npm run loadtest:time` load test time tracking
- `npm run loadtest:public-site` load test public site

## Testing
GetSoloDesk uses Vitest for unit and integration testing.

### Running Tests
```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Tests
- Unit tests: `tests/components/`, `tests/api/`
- Integration tests: `tests/integration/`
- Test files should follow the naming convention: `*.test.ts` or `*.test.tsx`

## Validation
- Type check: `npm run typecheck` or `npx tsc --noEmit`
- Lint: `npm run lint`
- Test: `npm run test:run`
- Production build: `npm run build`
- Run all checks: `npm run ci`

## Authentication & Security

### Signup Flow
1. User submits email + password via `/signup` form
2. Frontend validates:
   - Email format
   - Password requirements (8+ chars, 1 uppercase, 1 number)
3. Supabase Auth creates user account
4. Verification email sent automatically
5. User must verify email before login
6. After verification, `/api/auth/setup-profile` creates user profile

### Email Verification
- **Automatic**: Supabase sends verification email on signup
- **Manual Resend**: POST to `/api/auth/resend-verification` with `{ "email": "user@example.com" }`
- **Rate Limit**: 3 requests per 15 minutes per IP

### Testing Authentication Endpoints

#### Resend Verification Email
```bash
curl -X POST http://localhost:5173/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "If this email is registered and unverified, a verification link has been sent."
}
```

#### Profile Setup (after login)
```bash
curl -X POST http://localhost:5173/api/auth/setup-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Profile is ready"
}
```

### Security Features
- **Rate Limiting**: Auth endpoints limited to prevent abuse (Upstash Redis + in-memory fallback)
- **Input Validation**: Server-side validation prevents SQL/XSS injection
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Account Enumeration Prevention**: Generic error messages for failed operations
- **Password Hashing**: Handled by Supabase (bcrypt)
- **Row Level Security**: Supabase RLS policies on all tables

## Documentation

### Strategic Planning
- **📋 Planning Index:** `docs/PLANNING_INDEX.md` (start here for strategic overview)
- **🎯 Executive Summary:** `docs/EXECUTIVE_SUMMARY.md` (high-level strategy & metrics)
- **📊 Strategic Analysis:** `docs/STRATEGIC_ANALYSIS.md` (comprehensive planning document)
- **🗺️ Roadmap Tracker:** `docs/ROADMAP_TRACKER.md` (task progress & sprint planning)
- **🔍 Phase Comparison Guide:** `docs/PHASE_COMPARISON_GUIDE.md` (understand differences between phases)

### Technical Documentation
- Architecture: `docs/ARCHITECTURE.md`
- API Reference: `docs/API_REFERENCE.md`
- Deployment: `docs/DEPLOYMENT.md`
- Vercel linking/env import: `docs/VERCEL_SETUP.md`
- Operations Runbook: `docs/OPERATIONS_RUNBOOK.md`
- Security: `docs/SECURITY.md`
- Supabase exit plan: `docs/SUPABASE_EXIT_MIGRATION_PLAN.md`
- Release/versioning: `docs/RELEASE_VERSIONING.md`
- Merge Conflict Resolver: `docs/MERGE_CONFLICT_RESOLVER.md`
- Changelog: `CHANGELOG.md`
- Load testing: `docs/LOAD_TESTING.md`
- Production checklist: `DEPLOYMENT_CHECKLIST.md`

## Deployment (Vercel)
This project is Vercel-ready via `vercel.json`.

1. Import repo in Vercel
2. Configure environment variables
3. Deploy

Key production behaviors:
- Static pre-rendered marketing pages for SEO
- Static asset long-term cache (`/assets/*`, immutable)
- Serverless APIs under `/api/*`
- Edge caching for public site reads
- Global rate limiting for expensive endpoints when Upstash env vars are set

## License
Private project. All rights reserved.
 


# HustleDesk

HustleDesk is a freelancer operations platform built with React + Vite + Supabase + Vercel serverless APIs.

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

Rate Limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

See `.env.example` for the complete template.

## Scripts
- `npm run dev` start web + local API runner
- `npm run dev:web` start Vite only
- `npm run dev:api` start API runner only
- `npm run typecheck` TypeScript validation
- `npm run build` production build
- `npm run ci` typecheck + build
- `npm run release:patch` version bump + tag + push
- `npm run release:minor` version bump + tag + push
- `npm run release:major` version bump + tag + push
- `npm run preview` serve built app locally
- `npm run loadtest:jobs`
- `npm run loadtest:dashboard`
- `npm run loadtest:time`
- `npm run loadtest:public-site`

## Validation
- Type check: `npx tsc --noEmit`
- Production build: `npm run build`

## Documentation
- Architecture: `docs/ARCHITECTURE.md`
- API Reference: `docs/API_REFERENCE.md`
- Deployment: `docs/DEPLOYMENT.md`
- Vercel linking/env import: `docs/VERCEL_SETUP.md`
- Operations Runbook: `docs/OPERATIONS_RUNBOOK.md`
- Security: `docs/SECURITY.md`
- Release/versioning: `docs/RELEASE_VERSIONING.md`
- Changelog: `CHANGELOG.md`
- Load testing: `docs/LOAD_TESTING.md`
- Production checklist: `DEPLOYMENT_CHECKLIST.md`

## Deployment (Vercel)
This project is Vercel-ready via `vercel.json`.

1. Import repo in Vercel
2. Configure environment variables
3. Deploy

Key production behaviors:
- Static asset long-term cache (`/assets/*`, immutable)
- Serverless APIs under `/api/*`
- Edge caching for public site reads
- Global rate limiting for expensive endpoints when Upstash env vars are set

## License
Private project. All rights reserved.

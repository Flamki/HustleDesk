# Deployment Guide

## Target Platform
- Vercel (frontend + serverless API)

Project includes:
- `vercel.json`
- Vite production build
- API functions in `api/**/*.js`

## 1. Prerequisites
- Supabase project created
- Stripe account configured (optional but required for billing features)
- Resend account configured (optional but required for campaign sending)
- Upstash Redis configured (recommended for strict global rate limiting)

## 2. Environment Variables
Set these in Vercel Project Settings.

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

Rate limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3. Supabase Setup
Apply all migrations from:
- `supabase/migrations/`

Auth config:
- Site URL = deployed app URL
- Redirect URLs include hash routes used by login/auth flow

## 4. Deploy Steps
1. Import repository in Vercel
2. Confirm build command: `npm run build`
3. Confirm output directory: `dist`
4. Add environment variables
5. Deploy

## 5. Post-Deploy Verification
Run:
- `npx tsc --noEmit` (local check)
- `npm run build` (local check)
- `GET /api/auth/health` with token header
- login/signup + OAuth flow
- key dashboard and jobs pages
- public site load and signup flow
- Stripe checkout + webhook in test mode

## 6. Caching and Cost Notes
- Static assets are immutable-cached by Vercel.
- Public site reads are edge-cached from API.
- Expensive write endpoints are rate-limited globally when Upstash is configured.

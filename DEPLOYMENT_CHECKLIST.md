# Deployment Checklist

## 1. Environment Variables
- [ ] `VITE_SUPABASE_URL` is set to `https://<project-ref>.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` is set to your publishable/anon key
- [ ] `VITE_AUTH_REDIRECT_ORIGIN` is set to your deployed app origin (example: `https://app.yourdomain.com`)
- [ ] `SUPABASE_URL` is set in serverless/runtime env
- [ ] `SUPABASE_ANON_KEY` is set in serverless/runtime env
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in serverless/runtime env
- [ ] `HEALTHCHECK_TOKEN` is set for `/api/auth/health`
- [ ] `APP_BASE_URL` is set to deployed frontend origin
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` is set
- [ ] `UPSTASH_REDIS_REST_URL` is set (global API rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` is set (global API rate limiting)

## 2. Supabase Auth Configuration
- [ ] Site URL is your production app URL
- [ ] Redirect URLs include:
- [ ] `https://<your-app-domain>/login`
- [ ] `https://<your-app-domain>/app/dashboard`
- [ ] Google provider is enabled with valid Client ID + Client Secret
- [ ] Google callback URL configured:
- [ ] `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Custom SMTP is configured for reliable signup email delivery
- [ ] Stripe webhook endpoint configured to:
- [ ] `https://<your-app-domain>/api/payments/webhook`

## 3. Database and Migrations
- [ ] All migrations executed in production:
- [ ] `supabase/migrations/20260215_phase1_foundation_core.sql`
- [ ] `supabase/migrations/20260216000100_feature_1_2_jobs.sql`
- [ ] `supabase/migrations/20260216000200_email_subscriptions.sql`
- [ ] `supabase/migrations/20260216000300_time_tracker.sql`
- [ ] `supabase/migrations/20260216000400_client_segmentation_settings.sql`
- [ ] `supabase/migrations/20260216000500_billing_stripe.sql`
- [ ] `supabase/migrations/20260216000600_notification_settings.sql`
- [ ] `supabase/migrations/20260216000700_time_share_links.sql`
- [ ] `supabase/migrations/20260216000800_time_entry_share_links.sql`
- [ ] `supabase/migrations/20260216000900_email_marketing.sql`
- [ ] `supabase/migrations/20260216001000_template_overrides.sql`
- [ ] `supabase/migrations/20260216001100_marketing_websites.sql`
- [ ] `supabase/migrations/20260216001200_marketing_site_events.sql`
- [ ] `supabase/migrations/20260216001300_marketing_site_kind_and_config.sql`
- [ ] RLS policies verified for `users`, `jobs`, `time_entries`, `email_subscriptions`, `client_segmentation_settings`

## 4. Build and Runtime Verification
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Login with email/password works
- [ ] Login with Google works
- [ ] Signup creates auth user and `public.users` row
- [ ] Time tracker can create, list, and delete entries
- [ ] Jobs list and dashboard load without 4xx/5xx errors
- [ ] Analytics and clients pages load without runtime exceptions

## 5. Post-Deploy Checks
- [ ] Check browser console for errors in production
- [ ] Check `/api/auth/health` with `x-health-token` header
- [ ] Confirm favicon and static assets load with 200 responses
- [ ] Verify logout fully clears session and redirects to `/login`

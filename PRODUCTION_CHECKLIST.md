# Production Checklist

Complete production deployment checklist for GetSoloDesk. Follow this guide to ensure a smooth, secure, and reliable production deployment.

## Pre-Deployment

### 1. Environment Configuration

#### Frontend Environment Variables (VITE_*)
- [ ] `VITE_SUPABASE_URL` - Set to production Supabase URL OR proxy URL (`https://<your-domain>/api/sb`)
- [ ] `VITE_SUPABASE_ANON_KEY` - Set to production publishable/anon key
- [ ] `VITE_AUTH_REDIRECT_ORIGIN` - Set to production app URL (no localhost)
- [ ] `VITE_STRIPE_PRICE_ID_PRO_MONTHLY` - Set to production Stripe price ID
- [ ] `VITE_GOOGLE_ADSENSE_CLIENT_ID` - Set to approved AdSense client ID (`ca-pub-...`)
- [ ] `VITE_GOOGLE_ADSENSE_BLOG_INDEX_SLOT` - Set to blog index ad unit slot ID
- [ ] `VITE_GOOGLE_ADSENSE_BLOG_POST_TOP_SLOT` - Set to blog post top ad unit slot ID
- [ ] `VITE_GOOGLE_ADSENSE_BLOG_POST_BOTTOM_SLOT` - Set to blog post bottom ad unit slot ID
- [ ] `VITE_GOOGLE_ADSENSE_TEST_MODE` - Keep `false` in production
- [ ] Verify no localhost URLs in production environment variables

#### Backend Environment Variables
- [ ] `SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (keep secret!)
- [ ] `HEALTHCHECK_TOKEN` - Secure random token for health endpoint
- [ ] `APP_BASE_URL` - Production frontend URL
- [ ] `PUBLIC_APP_URL` - Production public URL

#### Billing Configuration
- [ ] `STRIPE_SECRET_KEY` - Production Stripe secret key (not test mode)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` - Production price ID
- [ ] Stripe webhook endpoint configured: `https://<your-domain>/api/payments/webhook`
- [ ] Stripe webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

#### Email Marketing Configuration
- [ ] `RESEND_API_KEY` - Production Resend API key
- [ ] `MARKETING_FROM_EMAIL` - Verified sender email
- [ ] `MARKETING_FROM_NAME` - Display name for emails
- [ ] Domain verified in Resend dashboard
- [ ] DNS records (SPF, DKIM) configured for email domain

#### Rate Limiting (Recommended)
- [ ] `UPSTASH_REDIS_REST_URL` - Global Redis instance URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis token
- [ ] Verify Redis instance is in production mode

#### Optional Features
- [ ] `GEMINI_API_KEY` - If using AI features
- [ ] Any other third-party API keys configured

#### Blog Monetization
- [ ] Site is approved in Google AdSense before expecting live PPC ads to render
- [ ] `public/ads.txt` is created from `public/ads.txt.example` with your real `pub-...` publisher ID
- [ ] `https://<your-domain>/ads.txt` returns a 200 response with the AdSense seller line

### 2. Supabase Configuration

#### Database
- [ ] All migrations applied in correct order (see DEPLOYMENT_CHECKLIST.md)
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Database connection limit appropriate for expected load
- [ ] Database backups enabled (daily at minimum)
- [ ] Point-in-time recovery enabled

#### Authentication
- [ ] Site URL set to production URL
- [ ] Redirect URLs configured:
  - [ ] `https://<your-domain>/login`
  - [ ] `https://<your-domain>/app/dashboard`
- [ ] Google OAuth provider configured (if applicable):
  - [ ] Client ID and Secret set
  - [ ] Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Email templates customized for brand
- [ ] Custom SMTP configured for reliable email delivery
- [ ] Email rate limits configured
- [ ] Confirm email required for signup (recommended)

#### Security
- [ ] Service role key never exposed to client
- [ ] API keys rotated if previously committed to version control
- [ ] RLS policies tested for all user scenarios
- [ ] Anonymous access restricted appropriately

### 3. Code Quality & Testing

#### Build Validation
- [ ] `npm run typecheck` passes without errors
- [ ] `npm run build` completes successfully
- [ ] Build artifacts reviewed (no unexpected files in dist/)
- [ ] Bundle sizes acceptable (< 1MB for main chunks)
- [ ] No console errors in production build

#### Testing
- [ ] Load tests run successfully (k6 scripts)
  - [ ] `npm run loadtest:jobs`
  - [ ] `npm run loadtest:dashboard`
  - [ ] `npm run loadtest:time`
  - [ ] `npm run loadtest:public-site`
- [ ] Manual testing of critical paths:
  - [ ] Signup flow (email + password)
  - [ ] Login flow (email + password)
  - [ ] OAuth login (Google)
  - [ ] Job creation and management
  - [ ] Time tracking
  - [ ] Billing/subscription flow
  - [ ] Email campaign creation
  - [ ] Public site creation and viewing
  - [ ] Profile updates

#### Security Scan
- [ ] Dependencies audited (`npm audit`)
- [ ] Critical vulnerabilities resolved
- [ ] CodeQL scan passed (if available)
- [ ] No secrets in source code
- [ ] API endpoints require authentication where appropriate

### 4. Performance Optimization

#### Frontend
- [ ] Lazy loading enabled for route components
- [ ] Images optimized (compressed, appropriate formats)
- [ ] Code splitting configured (vendor, icons, supabase chunks)
- [ ] Static assets cached with appropriate headers
- [ ] Bundle analysis reviewed (no unexpected large dependencies)

#### Backend
- [ ] API endpoints use appropriate caching strategies
- [ ] Rate limiting enabled on expensive endpoints
- [ ] Database queries optimized with indexes
- [ ] N+1 query issues resolved
- [ ] Connection pooling configured

#### Caching Strategy
- [ ] Static assets: 1 year cache with immutable flag
- [ ] API responses: Appropriate cache TTLs
- [ ] Database queries: In-memory caching where appropriate (10-15s TTL)
- [ ] Cache invalidation on write operations

### 5. Monitoring & Logging Setup

#### Error Tracking
- [ ] Error tracking service configured (optional but recommended):
  - [ ] Sentry, Rollbar, Datadog, or similar
  - [ ] DSN/API keys configured
  - [ ] Source maps uploaded (if using)
  - [ ] Release tracking enabled
- [ ] Error tracking hooks initialized in app
- [ ] Test error reporting (trigger test error, verify capture)

#### Logging
- [ ] Production log level set to `info` or higher
- [ ] Sensitive data not logged (passwords, tokens, PII)
- [ ] Request IDs tracked for request correlation
- [ ] Structured logging format consistent

#### Performance Monitoring
- [ ] Performance metrics collection enabled
- [ ] Web Vitals tracking initialized
- [ ] Slow API calls logged (> 3s)
- [ ] Database query performance monitored

#### Health Checks
- [ ] `/api/auth/health` endpoint configured
- [ ] Health check token secured
- [ ] Supabase connectivity verified in health check
- [ ] Health check integrated with uptime monitoring

### 6. Analytics Integration

- [ ] Analytics service initialized (optional):
  - [ ] Google Analytics, Mixpanel, Amplitude, or similar
  - [ ] Tracking ID configured
  - [ ] Cookie consent implemented (GDPR compliance)
- [ ] Key events tracked:
  - [ ] User signup/login
  - [ ] Feature usage
  - [ ] Subscription events
  - [ ] Conversion events
- [ ] Privacy policy includes analytics disclosure
- [ ] User opt-out mechanism available

### 7. Infrastructure & Deployment

#### Vercel Configuration
- [ ] Production domain configured
- [ ] SSL certificate active (automatic via Vercel)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Node.js version: 20.x or higher
- [ ] Function timeout: 30 seconds (configured in vercel.json)
- [ ] Environment variables set in Vercel dashboard

#### DNS Configuration
- [ ] Domain pointed to Vercel
- [ ] DNS propagation complete (check with `dig` or `nslookup`)
- [ ] CDN caching configured appropriately
- [ ] Subdomain configuration if applicable

#### Security Headers
- [ ] Content-Security-Policy configured (if needed)
- [ ] X-Content-Type-Options: nosniff (configured in vercel.json)
- [ ] Referrer-Policy: strict-origin-when-cross-origin (configured)
- [ ] X-Frame-Options: SAMEORIGIN (recommended)
- [ ] Strict-Transport-Security (HSTS) enabled

## Deployment

### 1. Pre-Deployment Verification
- [ ] All pre-deployment checklist items completed
- [ ] Production branch up-to-date with latest changes
- [ ] Changelog updated with release notes
- [ ] Team notified of upcoming deployment
- [ ] Maintenance window communicated to users (if applicable)

### 2. Deploy
- [ ] Push to production branch or merge PR
- [ ] Vercel deployment triggered
- [ ] Build completes successfully
- [ ] No build warnings reviewed and addressed
- [ ] Deployment preview reviewed before promoting

### 3. Smoke Tests
Run immediately after deployment:

- [ ] Homepage loads without errors
- [ ] Login with email/password works
- [ ] Login with Google OAuth works
- [ ] Dashboard loads and displays user data
- [ ] Create new job successfully
- [ ] Create time entry successfully
- [ ] Check browser console for errors
- [ ] Verify static assets load (check Network tab)
- [ ] Test on mobile browser
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### 4. Post-Deployment Monitoring

#### First 30 Minutes
- [ ] Monitor error rates (should not spike)
- [ ] Check API response times (should be normal)
- [ ] Monitor CPU/memory usage
- [ ] Watch for failed requests (5xx errors)
- [ ] Check database connection pool usage
- [ ] Monitor Supabase dashboard for anomalies

#### First 24 Hours
- [ ] Review error logs for new/unusual errors
- [ ] Check user feedback channels
- [ ] Monitor key performance metrics
- [ ] Verify scheduled jobs running (if any)
- [ ] Check webhook delivery success rates
- [ ] Verify email delivery working

#### First Week
- [ ] Review analytics for user behavior changes
- [ ] Monitor subscription/billing events
- [ ] Check for security incidents
- [ ] Review performance trends
- [ ] Gather user feedback

## Post-Deployment

### 1. Verification Checklist

#### Functional Testing
- [ ] All critical user flows tested
- [ ] Public marketing pages load correctly
- [ ] SEO meta tags present and correct
- [ ] sitemap.xml accessible
- [ ] robots.txt configured correctly
- [ ] Open Graph tags for social sharing

#### Integration Testing
- [ ] Stripe webhook receiving events
- [ ] Email sending working (test campaign)
- [ ] OAuth flows complete successfully
- [ ] Public site signups create users
- [ ] Time share links work
- [ ] Job status updates trigger notifications (if enabled)

#### Performance Verification
- [ ] Lighthouse score acceptable (> 90 for performance on static pages)
- [ ] Core Web Vitals within acceptable ranges:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] API response times < 500ms for p95
- [ ] Database query times acceptable

### 2. Security Verification

- [ ] No API keys exposed in client-side code
- [ ] HTTPS enforced (no mixed content)
- [ ] Security headers present (check securityheaders.com)
- [ ] CORS configured correctly
- [ ] Rate limiting working (test with multiple requests)
- [ ] Authentication required for protected routes
- [ ] Authorization checks enforced (users can't access others' data)

### 3. Monitoring Configuration

#### Alerts (Recommended)
Set up alerts for:
- [ ] Error rate > 5%
- [ ] API response time p95 > 2s
- [ ] Health check failures
- [ ] Webhook delivery failures > 10%
- [ ] Database connection pool exhaustion
- [ ] Disk space > 80%

#### Dashboards
Create monitoring dashboards for:
- [ ] Request volume and response times
- [ ] Error rates by endpoint
- [ ] User signups and active users
- [ ] Subscription events
- [ ] Database performance metrics

### 4. Documentation

- [ ] Deployment documented with date and version
- [ ] Known issues documented
- [ ] Rollback procedure documented
- [ ] On-call rotation updated (if applicable)
- [ ] Runbook updated with any new procedures

## Rollback Procedure

If critical issues are detected:

### 1. Immediate Actions
- [ ] Identify the issue and impact
- [ ] Notify team and stakeholders
- [ ] Decide: Fix forward or rollback?

### 2. Rollback Steps
- [ ] In Vercel dashboard, go to Deployments
- [ ] Find last known good deployment
- [ ] Click "..." menu and select "Promote to Production"
- [ ] Verify rollback successful
- [ ] Monitor for stability
- [ ] Communicate status to users

### 3. Post-Rollback
- [ ] Document what went wrong
- [ ] Create issues for identified problems
- [ ] Update deployment procedures to prevent recurrence
- [ ] Schedule fix and redeployment

## Maintenance

### Daily
- [ ] Check error logs for unusual patterns
- [ ] Monitor uptime and performance metrics
- [ ] Review support tickets for deployment-related issues

### Weekly
- [ ] Review analytics and usage trends
- [ ] Check for security updates in dependencies
- [ ] Review and clear old logs
- [ ] Database performance review

### Monthly
- [ ] Review and update documentation
- [ ] Audit user access and permissions
- [ ] Review and optimize slow queries
- [ ] Capacity planning review
- [ ] Security audit

### Quarterly
- [ ] Dependency updates (major versions)
- [ ] Disaster recovery drill
- [ ] Performance optimization review
- [ ] User feedback synthesis and roadmap update

## Emergency Contacts

Document key contacts for production issues:

- **Infrastructure**: Vercel Support
- **Database**: Supabase Support
- **Payment Processing**: Stripe Support
- **Email Delivery**: Resend Support
- **Team Contacts**: [Add your team contacts]
- **On-Call Engineer**: [Current rotation]

## Additional Resources

- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Detailed deployment guide
- [OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md) - Operations procedures
- [SECURITY.md](docs/SECURITY.md) - Security guidelines
- [LOAD_TESTING.md](docs/LOAD_TESTING.md) - Load testing guide
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture

---

**Last Updated**: 2026-02-17
**Maintained By**: GetSoloDesk Team


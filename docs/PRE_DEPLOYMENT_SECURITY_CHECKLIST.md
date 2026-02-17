# Pre-Deployment Security Checklist

Use this checklist before deploying to production to ensure all security measures are in place.

## Environment Configuration

### Required Environment Variables
- [ ] `SUPABASE_URL` - Set to production Supabase URL
- [ ] `SUPABASE_ANON_KEY` - Set to production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to production service role key (KEEP SECRET!)
- [ ] `VITE_SUPABASE_URL` - Same as SUPABASE_URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
- [ ] `HEALTHCHECK_TOKEN` - Set to strong random token (32+ chars)

### Stripe Configuration
- [ ] `STRIPE_SECRET_KEY` - Production secret key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY` - Production price ID
- [ ] `APP_BASE_URL` - Production app URL (no trailing slash)
- [ ] Verify Stripe webhook endpoint is registered
- [ ] Test webhook signature validation

### Email Configuration (if using)
- [ ] `RESEND_API_KEY` - Production API key
- [ ] `MARKETING_FROM_EMAIL` - Verified domain email
- [ ] `MARKETING_FROM_NAME` - Brand name
- [ ] `PUBLIC_APP_URL` - Production URL
- [ ] Verify DKIM/SPF/DMARC records configured

### Rate Limiting (Recommended)
- [ ] `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- [ ] Test rate limiting is working

## Supabase Configuration

### Database Security
- [ ] Row Level Security (RLS) enabled on all user tables
- [ ] RLS policies tested and working
- [ ] Public read access only for published content
- [ ] Service role key access patterns reviewed
- [ ] Database backups enabled
- [ ] Point-in-time recovery configured

### Authentication
- [ ] Email authentication enabled
- [ ] OAuth providers configured (if using)
- [ ] Email verification required
- [ ] Password requirements configured
- [ ] Account lockout policy reviewed
- [ ] Session timeout configured

### API Keys
- [ ] Anon key is read-only where appropriate
- [ ] Service role key not exposed to client
- [ ] API key rotation schedule documented

## Application Security

### Code Security
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] CodeQL scan completed with 0 alerts
- [ ] No `dangerouslySetInnerHTML` in code
- [ ] No hardcoded secrets or API keys
- [ ] TypeScript type checking passes

### Security Headers
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set
- [ ] X-XSS-Protection enabled
- [ ] HSTS configured with preload
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured
- [ ] X-Content-Type-Options set to nosniff

### CORS Configuration
- [ ] CORS origins set to production domains only
- [ ] No `Access-Control-Allow-Origin: *` in production
- [ ] Credentials allowed only for authenticated requests
- [ ] Preflight caching configured

### Input Validation
- [ ] All API endpoints validate input types
- [ ] String inputs have length limits
- [ ] Email addresses validated and sanitized
- [ ] URLs validated before use
- [ ] Slug/identifier formats enforced
- [ ] Suspicious patterns detected and rejected

### Rate Limiting
- [ ] Rate limiting active on all public endpoints
- [ ] Auth endpoints have strict rate limits
- [ ] Health check endpoint rate limited
- [ ] Rate limit headers sent in responses
- [ ] Redis-backed rate limiting configured (recommended)

### Authentication & Authorization
- [ ] Bearer token validation on all protected endpoints
- [ ] JWT signature verification working
- [ ] Token expiration handled properly
- [ ] OAuth token cleanup implemented
- [ ] Admin endpoints require additional checks
- [ ] User can only access their own data (verified via RLS)

## Infrastructure Security

### Vercel Configuration
- [ ] Production deployment branch configured
- [ ] Environment variables set in Vercel dashboard
- [ ] Deployment protection enabled
- [ ] Preview deployments security reviewed
- [ ] Build logs don't expose secrets

### DNS & Domain
- [ ] HTTPS certificate active and valid
- [ ] CAA records configured (optional but recommended)
- [ ] Domain ownership verified
- [ ] Redirect HTTP to HTTPS
- [ ] www/non-www redirect configured

### Monitoring & Logging
- [ ] Security event logging active
- [ ] Log aggregation configured (optional)
- [ ] Alerting set up for suspicious activity (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Error tracking configured (optional)

## Third-Party Integrations

### Stripe
- [ ] Webhook signature verification implemented
- [ ] Webhook secret is production secret
- [ ] Test payments disabled in production
- [ ] Customer portal configured
- [ ] Subscription management tested

### Email Service (Resend)
- [ ] Domain verified
- [ ] DKIM configured
- [ ] SPF record added
- [ ] DMARC policy configured
- [ ] Unsubscribe links included in all marketing emails
- [ ] Test email delivery

### Upstash Redis (if using)
- [ ] TLS connection enabled
- [ ] Access token secured
- [ ] Connection tested from production environment

## Security Testing

### Penetration Testing (Optional)
- [ ] Manual security testing completed
- [ ] Automated security scans run
- [ ] External penetration test (for high-security needs)
- [ ] Findings documented and addressed

### Authentication Testing
- [ ] Login flow tested
- [ ] Signup flow tested
- [ ] Password reset tested
- [ ] OAuth flow tested (if applicable)
- [ ] Session expiration tested
- [ ] Token refresh tested

### API Testing
- [ ] All endpoints tested with valid auth
- [ ] All endpoints reject invalid auth
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] Error responses don't leak info

### OWASP Top 10 Review
- [ ] A01: Broken Access Control - RLS enforced, auth validated
- [ ] A02: Cryptographic Failures - TLS enforced, secrets secured
- [ ] A03: Injection - Input validated, parameterized queries
- [ ] A04: Insecure Design - Security patterns documented
- [ ] A05: Security Misconfiguration - Headers configured, defaults changed
- [ ] A06: Vulnerable Components - Dependencies audited
- [ ] A07: Authentication Failures - Strong auth, rate limiting
- [ ] A08: Software/Data Integrity - Webhooks validated
- [ ] A09: Logging Failures - Security events logged
- [ ] A10: Server-Side Request Forgery - URLs validated

## Documentation

- [ ] Security documentation updated (SECURITY.md)
- [ ] Security testing summary completed (SECURITY_TESTING.md)
- [ ] Deployment checklist reviewed (DEPLOYMENT_CHECKLIST.md)
- [ ] API documentation includes auth requirements
- [ ] Incident response plan documented

## Compliance (if applicable)

- [ ] GDPR compliance reviewed (if EU users)
- [ ] CCPA compliance reviewed (if CA users)
- [ ] CAN-SPAM compliance for marketing emails
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] Cookie consent configured (if needed)

## Final Checks

- [ ] All checklist items above completed
- [ ] Security team/lead reviewed and approved
- [ ] Backup and recovery procedures tested
- [ ] Incident response contacts documented
- [ ] Rollback plan prepared
- [ ] Post-deployment monitoring plan ready

## Post-Deployment

### Immediate (First 24 Hours)
- [ ] Monitor error logs
- [ ] Check security event logs
- [ ] Verify rate limiting working
- [ ] Test production auth flow
- [ ] Verify webhook deliveries
- [ ] Check uptime monitoring

### First Week
- [ ] Review security logs daily
- [ ] Monitor rate limit hit rates
- [ ] Check for authentication anomalies
- [ ] Verify backup completion
- [ ] Test incident response procedures

### First Month
- [ ] Weekly security log review
- [ ] Run npm audit weekly
- [ ] Check for security updates
- [ ] Review user access patterns
- [ ] Update security documentation if needed

## Emergency Contacts

- Security lead: [Contact]
- DevOps/Infrastructure: [Contact]
- Supabase support: support@supabase.com
- Vercel support: support@vercel.com
- Stripe support: support@stripe.com

## Notes

Add any deployment-specific notes or exceptions here:

---

**Completed by:** _______________  
**Date:** _______________  
**Approved by:** _______________  
**Deployment date:** _______________  

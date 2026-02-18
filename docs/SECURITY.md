# Security Documentation

This document outlines the security measures, best practices, and audit checklist for HustleDesk.

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Security](#api-security)
4. [Data Protection](#data-protection)
5. [Client-Side Security](#client-side-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Monitoring & Incident Response](#monitoring--incident-response)
8. [Security Checklist](#security-checklist)

## Security Architecture

### Defense in Depth
HustleDesk implements multiple layers of security:
- Network layer: HTTPS/TLS, security headers, CORS
- Application layer: Input validation, rate limiting, authentication
- Data layer: Row Level Security (RLS), encryption at rest
- Infrastructure: Vercel edge network, Supabase security

### Threat Model
Primary threats addressed:
- Unauthorized access to user data
- SQL injection and XSS attacks
- CSRF and clickjacking
- API abuse and DoS attacks
- Credential theft and session hijacking
- Bot attacks and spam
- Webhook forgery

## Authentication & Authorization

### Authentication Flow
1. **User Registration**
   - Email/password with strong password requirements (8+ chars, uppercase, lowercase, numbers, symbols)
   - OAuth support (Google Sign-In) via Supabase
   - Email verification required before full access
   - Rate limiting: 5 attempts per 15 minutes per IP

2. **Login Process**
   - Supabase JWT tokens for session management
   - Tokens stored in localStorage (httpOnly cookies not available in SPA)
   - Auto-refresh mechanism for token rotation
   - Failed login attempts tracked and rate-limited

3. **Session Management**
   - JWT tokens validated on every API request
   - Tokens expire after configured period
   - Automatic session cleanup on logout
   - OAuth tokens stripped from URL hash to prevent exposure

### Authorization Patterns
- **Row Level Security (RLS)**: Enforced in Supabase for user-owned data
- **Service Role Key**: Used server-side only for admin operations
- **API Token Validation**: Bearer token required for all authenticated endpoints
- **Admin Checks**: Additional validation for privileged operations

### Token Security
- ✅ Service role keys never exposed to client
- ✅ Bearer tokens extracted and validated server-side
- ✅ Token format validation (length, structure)
- ✅ Automatic cleanup of OAuth fragments from browser history
- ✅ No tokens in URL parameters or logs

## API Security

### Input Validation
All API endpoints implement:
- **Type validation**: Ensure correct data types
- **Length limits**: Prevent buffer overflow and DoS
- **Format validation**: Email, URL, slug patterns
- **Sanitization**: Remove dangerous characters and control codes
- **Whitelist validation**: Platform/enum fields checked against allowed values

### Rate Limiting
Implemented at multiple levels:
```javascript
// Public signup: 20 requests/min per IP, 6/10min per email
// Profile setup: 5 requests/15min per IP
// Health check: 10 requests/min per IP
// General API: Configurable per endpoint
```

Rate limiting uses:
- **Primary**: Upstash Redis (distributed, persistent)
- **Fallback**: In-memory limiter (single instance)
- **Headers**: `X-RateLimit-Store`, `Retry-After`

### Security Headers
Set in `vercel.json` for all responses:
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN (DENY for API)
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: (see below)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://api.stripe.com;
frame-src 'self' https://js.stripe.com;
frame-ancestors 'self';
base-uri 'self';
form-action 'self'
```

### CORS Configuration
- API endpoints use explicit CORS headers
- Origin validation for cross-origin requests
- Credentials allowed only for authenticated requests
- Preflight caching for 24 hours

### Abuse Prevention
1. **Honeypot Fields**: Hidden form fields to catch bots (e.g., "website" field)
2. **Rate Limiting**: Aggressive limits on public endpoints
3. **IP Tracking**: Track and log suspicious IPs
4. **User Agent Analysis**: Log unusual user agents
5. **Unsubscribe Respect**: Never resubscribe unsubscribed users

## Data Protection

### Secrets and Environment
- ✅ `.env.local` never committed to git
- ✅ Service role keys stored in Vercel/platform secrets only
- ✅ Webhook secrets validated before processing
- ✅ API keys rotated regularly
- ✅ No secrets in client-side code or logs

### Encryption
- **In Transit**: HTTPS/TLS 1.2+ enforced
- **At Rest**: Supabase encrypts database at rest
- **Passwords**: Bcrypt hashing via Supabase auth
- **Sensitive Data**: Additional encryption for PII if needed

### Row Level Security (RLS)
Must remain enabled on tables:
- `users`: Users can only read/update their own profile
- `jobs`: Users can only access their own jobs
- `time_entries`: Users can only manage their own entries
- `marketing_contacts`: Users can only access their own contacts
- `marketing_sites`: Users can only manage their own sites

Public read access allowed for:
- Published marketing sites (where `published_at IS NOT NULL`)
- Shared time entry links (with valid token)

## Client-Side Security

### XSS Prevention
- ✅ React escapes all interpolated content by default
- ✅ No use of `dangerouslySetInnerHTML` in application code
- ✅ No `eval()` or `Function()` constructors
- ✅ All user input sanitized before display
- ✅ URLs encoded properly in links

### CSRF Protection
- ✅ APIs use Bearer token authentication (not cookies)
- ✅ Same-origin policy enforced
- ✅ State-changing operations require POST/PUT/DELETE
- ✅ Supabase handles CSRF internally

### Form Security
- Client-side validation before submission
- Server-side validation as authoritative
- Field-level error handling
- Protection against autocomplete attacks (where appropriate)

### Dependency Security
- Regular `npm audit` checks
- Automated dependency updates (Dependabot)
- Review of security advisories
- Pin major versions, allow patch updates

## Infrastructure Security

### Vercel Platform
- Edge network with DDoS protection
- Automatic HTTPS certificate management
- Serverless function isolation
- Environment variable encryption
- Deployment protection for production

### Supabase Security
- Database encryption at rest
- Connection pooling with SSL
- Row Level Security enforcement
- Regular security patches
- Backup and disaster recovery

### Third-Party Services
- **Stripe**: PCI-DSS compliant, webhook signature verification
- **Resend**: DKIM/SPF configured, API key secured
- **Upstash**: TLS encryption, token-based auth

## Monitoring & Incident Response

### Security Logging
Events logged:
- Authentication failures
- Authorization violations
- Rate limit exceedances
- Honeypot triggers
- Profile setup success/failure
- Admin access attempts

Log format:
```javascript
{
  type: 'EVENT_TYPE',
  userId: 'user-id-if-applicable',
  ip: 'client-ip',
  error: 'error-message-if-applicable',
  timestamp: 'ISO-8601-timestamp'
}
```

### Monitoring Checklist
- [ ] Set up log aggregation (e.g., Datadog, LogRocket)
- [ ] Configure alerting for suspicious patterns
- [ ] Monitor rate limit hit rates
- [ ] Track authentication failure rates
- [ ] Review security logs weekly
- [ ] Set up uptime monitoring

### Incident Response
1. **Detection**: Through logs, monitoring, or user report
2. **Assessment**: Determine scope and severity
3. **Containment**: Rate limit, block IPs, revoke tokens if needed
4. **Eradication**: Fix vulnerability, deploy patch
5. **Recovery**: Restore service, notify affected users
6. **Post-Mortem**: Document incident, improve defenses

## Security Checklist

### Pre-Deployment Security Audit

#### Authentication & Authorization
- [x] Strong password requirements enforced
- [x] OAuth properly configured with Supabase
- [x] JWT tokens validated on server side
- [x] Service role key used only server-side
- [x] Row Level Security (RLS) enabled on all user tables
- [x] Admin endpoints require additional authorization
- [x] Token extraction and validation standardized
- [x] OAuth tokens cleaned from URL fragments

#### API Security
- [x] All endpoints validate HTTP method
- [x] Input validation on all user inputs
- [x] Rate limiting on public endpoints
- [x] Rate limiting on auth endpoints
- [x] Honeypot fields for bot detection
- [x] CORS headers configured
- [x] Security headers in vercel.json
- [x] Content Security Policy defined
- [x] Error messages don't leak sensitive info
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (no dangerouslySetInnerHTML)

#### Data Protection
- [x] Secrets stored in environment variables
- [x] .env.local in .gitignore
- [x] Service role key not exposed to client
- [x] Stripe webhook signature verified
- [x] Email addresses validated and sanitized
- [x] URLs validated before use
- [x] Unsubscribe status respected

#### Infrastructure
- [x] HTTPS enforced (Vercel default)
- [x] Security headers configured
- [x] Rate limiting with Redis fallback
- [x] Health check endpoint protected
- [x] Dependency vulnerabilities checked (npm audit)
- [x] Environment validation on startup

#### Monitoring
- [x] Security event logging implemented
- [ ] Log aggregation configured (optional, production)
- [ ] Alerting set up for suspicious activity (optional, production)
- [ ] Uptime monitoring configured (optional, production)

### Production Deployment

#### Environment Configuration
- [ ] All environment variables set in Vercel
- [ ] Service role key is production key
- [ ] Stripe webhook secret is production secret
- [ ] HEALTHCHECK_TOKEN is set to random value
- [ ] Upstash Redis configured (optional but recommended)
- [ ] CORS origins set to production domains only

#### Supabase Configuration
- [ ] Row Level Security policies verified
- [ ] Anonymous key is read-only where appropriate
- [ ] Service role key secured and not shared
- [ ] Email authentication enabled
- [ ] OAuth providers configured
- [ ] Rate limiting enabled in Supabase
- [ ] Database backups enabled

#### Stripe Configuration
- [ ] Webhook endpoint registered
- [ ] Webhook signature verification working
- [ ] Test mode disabled
- [ ] API version pinned
- [ ] Customer portal configured

#### DNS & Domain
- [ ] HTTPS certificate active
- [ ] HSTS header sent
- [ ] CAA records configured (optional)
- [ ] DMARC/SPF/DKIM for email domain

#### Final Checks
- [ ] Security headers verified (securityheaders.com)
- [ ] SSL configuration tested (ssllabs.com)
- [ ] OWASP Top 10 reviewed
- [ ] Penetration testing completed (for high-security needs)
- [ ] Security disclosure policy published
- [ ] Incident response plan documented

### Ongoing Security Maintenance

#### Weekly
- [ ] Review security logs for anomalies
- [ ] Check rate limit hit rates
- [ ] Monitor authentication failure rates

#### Monthly
- [ ] Run npm audit and fix vulnerabilities
- [ ] Review and rotate API keys if needed
- [ ] Check for Supabase security updates
- [ ] Review access logs for unusual patterns

#### Quarterly
- [ ] Full security audit
- [ ] Review and update RLS policies
- [ ] Test backup and recovery procedures
- [ ] Update security documentation
- [ ] Review incident response procedures

#### Annually
- [ ] Comprehensive penetration testing
- [ ] Security training for team
- [ ] Review and update security policies
- [ ] Audit third-party integrations

## Vulnerability Disclosure

If you discover a security vulnerability, please email security@hustledesk.com (or appropriate contact).

**Please do not:**
- Open public GitHub issues for security vulnerabilities
- Share vulnerabilities publicly before we've had time to fix them

**Please do:**
- Provide detailed steps to reproduce
- Allow reasonable time for fixes (90 days)
- Work with us to verify the fix

We appreciate responsible disclosure and will credit researchers (with permission) in our security advisories.

## Security Resources

### Tools Used
- **npm audit**: Dependency vulnerability scanning
- **CodeQL**: Static analysis security testing
- **Vercel Security**: DDoS protection, edge network
- **Supabase Security**: Database encryption, RLS
- **Upstash Redis**: Distributed rate limiting

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Vercel Security](https://vercel.com/docs/security)
- [Supabase Security](https://supabase.com/security)
- [Stripe Security](https://stripe.com/docs/security)

## Contact

For security concerns or questions:
- Security issues: security@hustledesk.com
- General questions: team@hustledesk.com

Last updated: 2026-02-17
Next review: 2026-05-17

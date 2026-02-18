# Security Policy

## Reporting a Vulnerability

We take the security of HustleDesk seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@hustledesk.com (or the appropriate security contact for your organization).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

- We will acknowledge receipt of your vulnerability report
- We will confirm the vulnerability and determine its impact
- We will release a fix as soon as possible, depending on complexity
- We will credit you for the discovery in our release notes (if you wish)

## Security Best Practices

For comprehensive security documentation, please refer to:

- **[Security Documentation](docs/SECURITY.md)** - Complete security architecture and best practices
- **[Security Testing](docs/SECURITY_TESTING.md)** - Security test results and validation
- **[Pre-Deployment Checklist](docs/PRE_DEPLOYMENT_SECURITY_CHECKLIST.md)** - Production security checklist
- **[Security Audit Summary](docs/SECURITY_AUDIT_SUMMARY.md)** - Latest security audit results

## Supported Versions

Security updates will be applied to the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Security Features

HustleDesk implements comprehensive security measures including:

### Authentication & Authorization
- JWT-based authentication via Supabase
- Row Level Security (RLS) enforced on all user data
- Rate limiting on authentication endpoints
- Strong password requirements
- OAuth support (Google Sign-In)

### API Security
- Input validation and sanitization on all endpoints
- Rate limiting (Redis-backed with memory fallback)
- CORS configuration
- Webhook signature verification (Stripe)
- Security event logging

### Infrastructure Security
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking prevention)
- HSTS with preload
- Comprehensive security headers
- TLS/HTTPS enforcement

### Data Protection
- Environment variable validation
- No hardcoded secrets
- Service role key isolation (server-only)
- Secure secret management

## Security Contacts

- General security inquiries: security@hustledesk.com
- For urgent security issues: security@hustledesk.com

## Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Do not access or modify other users' data without explicit permission
- Do not perform actions that could harm the reliability or integrity of our services

We commit to:

- Respond to your report promptly
- Keep you updated on our progress
- Credit you for the discovery (with your permission)
- Work with you to understand and resolve the issue quickly

## Recognition

We appreciate the security research community and recognize those who help us keep HustleDesk secure. With your permission, we will acknowledge your contribution in our release notes or security advisories.

## Legal

This security policy is subject to our Terms of Service. Security research must be conducted in accordance with applicable laws and regulations.

---

**Last Updated:** February 18, 2026  
**Next Review:** May 18, 2026

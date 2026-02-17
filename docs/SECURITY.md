# Security Notes

## Secrets and Environment
- Do not commit `.env.local`.
- Keep service role keys server-side only.
- Rotate keys after suspected exposure.

## Auth and Authorization
- User-facing APIs rely on Supabase JWT validation.
- Privileged operations use service role key only in serverless functions.
- Supabase Row Level Security (RLS) must remain enabled on user-owned tables.

## Public Endpoints
Public endpoints exist for:
- site rendering
- analytics events
- unsubscribe
- public signup
- shared time links

Controls applied:
- strict input validation
- publish-state checks on public site fetch
- global rate limiting for expensive public writes

## Billing and Webhooks
- Stripe webhook endpoint must validate webhook signature.
- Webhook secrets must be set only in server runtime env.

## Email Compliance
- Marketing sends are opt-in only.
- Unsubscribe URL is appended to sends.
- Keep `MARKETING_FROM_EMAIL` under verified domain.

## Hardening Headers
Set in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Recommended Next Hardening
- Add CSP policy tuned to current asset sources.
- Add bot mitigation/WAF for public write endpoints.
- Add audit log table for admin-sensitive operations.

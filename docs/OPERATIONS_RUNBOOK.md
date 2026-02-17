# Operations Runbook

## Routine Checks

Daily:
- Vercel function error rate
- API latency (p95/p99)
- Supabase DB health and slow queries
- Stripe webhook delivery failures

Weekly:
- Campaign send success/failure ratios
- Public site conversion metrics
- Traffic anomalies and abuse patterns

## Incident Triage

1. Identify failing endpoint:
- Check Vercel logs by function path.

2. Confirm dependency status:
- Supabase availability
- Stripe API status
- Resend status
- Upstash status

3. Apply immediate controls:
- Temporarily reduce heavy traffic features if needed
- Tighten rate limits (if abuse)
- Disable campaign sending if provider key invalid

4. Rollback strategy:
- Revert to previous Vercel deployment if regression introduced

## Rate Limiting Behavior

Endpoints protected:
- `POST /api/marketing/send`
- `POST /api/public/site-event`

Store preference:
- Upstash Redis (global)
- fallback: in-memory (per instance)

Operational header:
- `X-RateLimit-Store: upstash|memory`

## Cost Control Playbook

1. Confirm cache headers active:
- `/assets/*` immutable cache
- `/api/public/site` edge cache

2. Monitor top invocation routes:
- Public events write endpoint
- Marketing send endpoint

3. Add guardrails if needed:
- lower rate limits
- stricter event ingestion validation
- bot filtering at edge/WAF

## Performance Verification

Commands:
```bash
npx tsc --noEmit
npm run build
```

Load tests:
```bash
npm run loadtest:jobs
npm run loadtest:dashboard
npm run loadtest:time
npm run loadtest:public-site
```

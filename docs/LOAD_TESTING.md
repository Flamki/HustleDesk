# Load Testing Guide

This project includes `k6` scripts for key API paths:

- `scripts/loadtest/jobs.js` -> `GET /api/jobs`
- `scripts/loadtest/dashboard.js` -> `GET /api/dashboard/stats`
- `scripts/loadtest/time-entries.js` -> `GET /api/time-entries`
- `scripts/loadtest/public-site.js` -> `GET /api/public/site` (optional signup write test)

## 1. Prerequisites

1. Start app + API:
   - `npm run dev`
2. Install `k6`:
   - Windows (winget): `winget install k6.k6`
   - Verify: `k6 version`
3. Get a valid user access token for authenticated endpoints:
   - Sign in on the app in browser.
   - In browser devtools, copy current Supabase access token.
   - Set in shell as `AUTH_BEARER`.

## 2. Required Environment Variables (PowerShell)

Set once per shell session:

```powershell
$env:BASE_URL = "http://localhost:5173"
$env:AUTH_BEARER = "<paste_supabase_access_token>"
```

For public site tests:

```powershell
$env:SITE_SLUG = "<your_published_site_slug>"
```

Optional load tuning:

```powershell
$env:VUS = "20"
$env:DURATION = "60s"
```

## 3. Run Tests

Authenticated API tests:

```powershell
npm run loadtest:jobs
npm run loadtest:dashboard
npm run loadtest:time
```

Public site read test:

```powershell
npm run loadtest:public-site
```

Optional public signup write test (off by default):

```powershell
$env:LOADTEST_SIGNUP = "1"
$env:LOADTEST_SIGNUP_EMAIL_PREFIX = "loadtest"
$env:LOADTEST_SIGNUP_EMAIL_DOMAIN = "example.com"
npm run loadtest:public-site
```

Then disable again:

```powershell
$env:LOADTEST_SIGNUP = "0"
```

## 4. Pass/Fail Thresholds

All scripts enforce:

- `http_req_failed < 1%`
- `p90(http_req_duration) < 1200ms`
- `p95(http_req_duration) < 2000ms`
- `max(http_req_duration) < 5000ms`

If thresholds fail:

1. Check slow API route logs first.
2. Verify Supabase query plans and indexes for filters used.
3. Reduce payload size for list endpoints.
4. Add/extend short-lived caching where safe.

## 5. Production Notes

- Run read-heavy tests against production-like data volumes.
- Keep write tests small and isolated to avoid noisy data.
- For CI/CD, add a smoke profile (e.g. `VUS=5`, `DURATION=20s`) and a nightly profile (higher load).

# API Reference

This document lists major API groups and operational behavior.

Base path:
- `/api/*`

## Authentication

### `GET /api/auth/health`
Checks server auth/runtime readiness.

Headers:
- `x-health-token: <token>` or `Authorization: Bearer <token>`

## Jobs and Dashboard

### `GET /api/jobs`
List jobs for authenticated user.

### `POST /api/jobs`
Create job.

### `GET /api/dashboard/stats`
Dashboard summary metrics.

## Time Tracking

### `GET /api/time-entries`
List time entries.

### `POST /api/time-entries`
Create time entry.

### `GET /api/time-share-links`
List time share links.

### `POST /api/time-share-links`
Create time share link.

### `GET /api/public/time-share?token=...`
Public token-based time report.

### `GET /api/public/time-entry?token=...`
Public token-based single entry report.

## Marketing and Websites

### `GET /api/marketing/sites`
List sites owned by current user.

### `POST /api/marketing/sites`
Create/update a site config.

### `GET /api/public/site?slug=...`
Public site fetch by slug.

Caching:
- Successful responses use edge caching.
- Not-found responses use short edge cache.

### `POST /api/public/site-signup`
Public email signup capture.

### `POST /api/public/site-event`
Public analytics event write (`page_view`, `session_start`, `link_click`, `signup`).

Rate limiting:
- Global limiter (Upstash if configured) with fallback memory limiter.
- Returns `429` + `Retry-After` when throttled.

### `GET /api/marketing/website-analytics`
Owner analytics aggregates for a site.

## Email Campaigns

### `POST /api/marketing/send`
Send campaign emails to subscribed contacts.

Rate limiting:
- Global limiter (Upstash if configured) with fallback memory limiter.
- Returns `429` + `Retry-After`.
- Response header `X-RateLimit-Store`: `upstash` or `memory`.

Provider:
- Resend API (`RESEND_API_KEY` required)

## Billing

### `POST /api/payments/create-checkout-session`
Create Stripe checkout session.

### `POST /api/payments/create-portal-session`
Create Stripe customer portal session.

### `POST /api/payments/webhook`
Stripe webhook receiver.

### `GET /api/payments/invoices`
List user invoices.

## Error Model
- `200` success
- `400` validation/input errors
- `401` unauthorized
- `404` not found
- `405` method not allowed
- `429` throttled
- `500` server/runtime errors

Typical error body:
```json
{ "error": "message" }
```

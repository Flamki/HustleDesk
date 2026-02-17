# HustleDesk Website Mindmap

## 1. Auth and Access
- Goal: Secure account lifecycle and route protection.
- Routes:
  - `/signup`
  - `/login`
  - `/auth/check-email`
- Core logic:
  - `context/AuthContext.tsx`
  - `services/supabaseService.ts`
  - `components/layout/ProtectedRoute.tsx`
- Purpose:
  - Signup/login/session refresh.
  - Redirect unauthenticated users away from `/app/*`.
  - Handle OAuth callback URL hydration safely.

## 2. Core Workspace
- Goal: Job pipeline management for freelancers.
- Routes:
  - `/app/dashboard`
  - `/app/jobs`
  - `/app/jobs/new`
- Core logic:
  - `pages/DashboardPage.tsx`
  - `pages/JobsPage.tsx`
  - `pages/AddJobPage.tsx`
  - `services/supabaseService.ts`
- Purpose:
  - Capture opportunities.
  - Track status, followups, and revenue metrics.
  - Provide filtered and searchable job list.

## 3. Time Tracking
- Goal: Billable time tracking and client-share flow.
- Routes:
  - `/app/time`
  - `/share/time/:token`
  - `/share/time-entry/:token`
- Core logic:
  - `pages/TimeTrackerPage.tsx`
  - `services/timeTrackerService.ts`
  - `services/timeShareService.ts`
  - `services/timeEntryShareService.ts`
- Purpose:
  - Record sessions and earnings.
  - Share controlled reports/sessions with clients via token links.

## 4. Proposals and Templates
- Goal: Faster job application output.
- Routes:
  - `/app/proposals/generate/:jobId`
  - `/app/templates`
- Core logic:
  - `pages/ProposalGeneratorPage.tsx`
  - `pages/TemplatesPage.tsx`
  - `api/templates/overrides.js`
- Purpose:
  - Generate/edit proposals quickly.
  - Let users customize defaults without destroying base templates.

## 5. Insights and Intelligence
- Goal: Data-backed decision support.
- Routes:
  - `/app/analytics`
  - `/app/clients`
- Core logic:
  - `pages/AnalyticsPage.tsx`
  - `pages/ClientsPage.tsx`
  - `api/analytics/insights.js`
  - `api/clients/insights.js`
- Purpose:
  - Revenue/funnel/cohort/forecast visibility.
  - Client health and segmentation controls.

## 6. Marketing
- Goal: Lead generation and website funnel.
- Routes:
  - `/app/marketing`
  - `/app/marketing/website`
  - `/w/:slug`
- Core logic:
  - `pages/EmailMarketingPage.tsx`
  - `pages/MarketingWebsitePage.tsx`
  - `pages/PublicSitePage.tsx`
  - `api/marketing/*`
  - `api/public/site.js`, `api/public/site-signup.js`, `api/public/site-event.js`
- Purpose:
  - Manage contacts and campaigns.
  - Build exactly one `link_in_bio` and one `portfolio` site per user.
  - Track visits, sessions, signups, and conversion analytics.

## 7. Billing
- Goal: Subscription lifecycle.
- Routes:
  - `/app/settings?tab=billing`
- Core logic:
  - `api/payments/create-checkout-session.js`
  - `api/payments/create-portal-session.js`
  - `api/payments/webhook.js`
  - `api/payments/invoices.js`
- Purpose:
  - Upgrade plan.
  - Manage subscription.
  - Sync invoice/subscription state from Stripe.

## 8. Settings and Account Ops
- Goal: User preferences and safety controls.
- Routes:
  - `/app/settings`
  - `/app/updates`
  - `/app/help`
- Core logic:
  - `pages/SettingsPage.tsx`
  - `api/notifications/settings.js`
  - `api/subscriptions/subscribe.js`
- Purpose:
  - Profile and notification controls.
  - Account and support operations.

## 9. Guardrails and Reliability
- Startup config guard:
  - `components/system/StartupEnvGuard.tsx`
- Error boundary:
  - `components/system/AppErrorBoundary.tsx`
- Route loading UX:
  - `components/system/RouteLoader.tsx`
- Purpose:
  - Prevent blank screens from bad env.
  - Fail gracefully.
  - Keep navigation responsive with lazy routes.


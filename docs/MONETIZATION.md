# Monetization & Billing System

Complete guide to HustleDesk's pricing, subscription, and billing implementation.

## Overview

HustleDesk uses a tiered subscription model powered by Stripe. The system includes:

- **4 Pricing Tiers**: Free, Starter, Pro, Enterprise
- **Feature Gating**: Automatic enforcement of plan limits
- **Usage Tracking**: Real-time monitoring of resource usage
- **Upgrade/Downgrade**: Seamless plan transitions with proration
- **Failed Payments**: Automatic retry and grace period handling
- **Webhooks**: Stripe event handling for subscription updates

## Pricing Tiers

### Free Plan
- **Price**: $0/month
- **Limits**:
  - 10 jobs
  - 5 clients
  - 50 time entries/month
  - 2 proposals/month
  - 5 AI credits/month
  - 1 portfolio site
  - 1 link-in-bio site
- **Features**:
  - Time tracking
  - Basic CRM

### Starter Plan
- **Price**: $29/month or $290/year (save $58)
- **Limits**:
  - 50 jobs
  - 25 clients
  - 500 time entries/month
  - 20 proposals/month
  - 100 AI credits/month
  - 5 email campaigns/month
  - 500 email contacts
  - 1 marketing website
  - 1 portfolio site
  - 1 link-in-bio site
- **Features**:
  - All Free features
  - AI proposal generation
  - Client portal
  - Invoicing
  - Analytics dashboard

### Pro Plan (Most Popular)
- **Price**: $79/month or $790/year (save $158)
- **Limits**:
  - Unlimited jobs
  - Unlimited clients
  - Unlimited time entries
  - Unlimited proposals
  - 1,000 AI credits/month
  - 50 email campaigns/month
  - 5,000 email contacts
  - 3 marketing websites
  - 3 portfolio sites
  - 3 link-in-bio sites
- **Features**:
  - All Starter features
  - Advanced reports
  - API access
  - Webhooks
  - Custom domains
  - Priority support
  - 5 team members
  - 20 client users

### Enterprise Plan
- **Price**: $299/month or $2,990/year (save $598)
- **Limits**: Unlimited everything
- **Features**:
  - All Pro features
  - SSO login
  - Whitelabel
  - Unlimited team members
  - Unlimited client users
  - 10,000 AI credits/month

## Implementation

### Database Schema

#### users table (enhanced columns)
```sql
-- Pricing and subscription
plan_tier varchar(20) DEFAULT 'free'
billing_interval varchar(10) DEFAULT 'monthly'
stripe_customer_id text UNIQUE
stripe_subscription_id text UNIQUE
stripe_subscription_status text
stripe_current_period_end timestamptz

-- Usage tracking
jobs_count integer DEFAULT 0
clients_count integer DEFAULT 0
time_entries_month_count integer DEFAULT 0
proposals_month_count integer DEFAULT 0
email_campaigns_month_count integer DEFAULT 0
email_contacts_count integer DEFAULT 0
marketing_websites_count integer DEFAULT 0
portfolio_sites_count integer DEFAULT 0
linkinbio_sites_count integer DEFAULT 0
ai_credits_used integer DEFAULT 0
ai_credits_limit integer DEFAULT 5

-- Usage period
usage_period_start timestamptz DEFAULT now()
usage_period_end timestamptz

-- Payment failure tracking
payment_failed_at timestamptz
payment_retry_count integer DEFAULT 0
```

#### usage_events table
```sql
CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### subscription_changes table
```sql
CREATE TABLE subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_plan varchar(20),
  to_plan varchar(20) NOT NULL,
  from_interval varchar(10),
  to_interval varchar(10),
  stripe_subscription_id text,
  change_type varchar(20) NOT NULL, -- upgrade, downgrade, cancellation, reactivation
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### API Endpoints

#### POST /api/payments/create-checkout-session
Creates a Stripe checkout session for subscription.

**Request**: None (uses auth token)
**Response**: `{ url: string }`

#### POST /api/payments/create-portal-session
Creates a Stripe billing portal session.

**Request**: None (uses auth token)
**Response**: `{ url: string }`

#### GET /api/payments/invoices
Retrieves user's Stripe invoices.

**Response**: `{ invoices: BillingInvoice[] }`

#### POST /api/payments/webhook
Handles Stripe webhook events.

**Events handled**:
- `checkout.session.completed`: New subscription
- `customer.subscription.created/updated/deleted`: Subscription changes
- `invoice.payment_failed`: Failed payment tracking
- `invoice.payment_succeeded`: Clear failure flags

#### POST /api/subscriptions/manage
Manages subscription upgrades, downgrades, cancellations.

**Request**:
```json
{
  "action": "upgrade" | "downgrade" | "cancel" | "reactivate",
  "tier": "starter" | "pro" | "enterprise",
  "interval": "monthly" | "yearly"
}
```

**Response**: `{ success: boolean, url?: string, message?: string }`

#### GET /api/usage/stats
Get current usage statistics.

**Response**: `{ usage: UsageStats }`

#### POST /api/usage/stats
Track a usage event.

**Request**:
```json
{
  "eventType": "job_created",
  "resourceId": "uuid",
  "metadata": {},
  "incrementCounter": "jobs"
}
```

### Feature Gating

#### Backend (Node.js)
```javascript
import { checkLimit } from '../_shared/featureGating.js';

// In your endpoint
const limitCheck = await checkLimit(supabase, user.id, 'jobs');
if (!limitCheck.allowed) {
  return json(res, 403, {
    error: limitCheck.reason,
    upgradeRequired: limitCheck.upgradeRequired,
    currentUsage: limitCheck.currentUsage,
    limit: limitCheck.limit,
  });
}

// After successful creation, increment counter
await supabase
  .from('users')
  .update({ jobs_count: (limitCheck.currentUsage || 0) + 1 })
  .eq('id', user.id);
```

#### Frontend (React)
```typescript
import { useFeatureAccess, useLimitInfo, FeatureGate, UpgradePrompt } from '../utils/featureGating';

// Check feature access
const hasAnalytics = useFeatureAccess('analytics');

// Get limit info
const jobsLimit = useLimitInfo('jobs', currentJobsCount);
if (jobsLimit.isReached) {
  // Show upgrade prompt
}

// Conditional rendering
<FeatureGate feature="analytics" fallback={<UpgradePrompt feature="Analytics" />}>
  <AnalyticsDashboard />
</FeatureGate>
```

### Stripe Configuration

#### Required Environment Variables

```bash
# Backend
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...

# Frontend (optional)
VITE_STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_STARTER_YEARLY=price_...
VITE_STRIPE_PRICE_ID_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_PRO_YEARLY=price_...
VITE_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...
```

#### Setting Up Stripe Products

1. **Create Products in Stripe Dashboard**
   - Go to Products → Add Product
   - Create: Starter, Pro, Enterprise
   - For each product, create two prices: monthly and yearly

2. **Configure Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

3. **Test Mode**
   - Use test mode for development
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

## Usage Tracking

### Automatic Counter Updates

The system automatically tracks:
- Job creation → `jobs_count`
- Client addition → `clients_count`
- Time entries → `time_entries_month_count`
- Proposals → `proposals_month_count`
- Email campaigns → `email_campaigns_month_count`
- Email contacts → `email_contacts_count`

### Monthly Reset

Monthly counters reset automatically based on `usage_period_end`:
- `time_entries_month_count`
- `proposals_month_count`
- `email_campaigns_month_count`
- `ai_credits_used`

Run this function periodically (e.g., via cron):
```sql
SELECT public.reset_monthly_usage_counters();
```

## Failed Payment Handling

### Grace Period
- Users retain access for 7 days after first payment failure
- `payment_failed_at` timestamp tracks first failure
- `payment_retry_count` increments on each failure
- Stripe automatically retries failed payments

### Automatic Downgrades
After grace period expires:
- Subscription canceled via webhook
- User downgraded to `free` tier
- Access restricted based on free plan limits

### Reactivation
Users can update payment method via Stripe portal:
1. Fix payment method
2. Stripe retries payment
3. On success, `invoice.payment_succeeded` webhook fires
4. System clears failure flags
5. Full access restored

## Upgrade/Downgrade Flow

### Immediate Upgrades
1. User clicks "Upgrade" button
2. Frontend calls `/api/subscriptions/manage` with `action: "upgrade"`
3. If no existing subscription → redirect to Stripe Checkout
4. If existing subscription → Stripe updates subscription with proration
5. Webhook syncs new tier immediately
6. User gets instant access to new features

### End-of-Period Downgrades
1. User clicks "Downgrade" button
2. Frontend calls `/api/subscriptions/manage` with `action: "downgrade"`
3. Subscription set to `cancel_at_period_end`
4. User retains access until period ends
5. At period end, subscription deleted via webhook
6. User downgraded to target tier

### Cancellations
1. User clicks "Cancel" button
2. Subscription set to `cancel_at_period_end`
3. User retains access until period ends
4. At period end, downgraded to `free` tier

## Testing

### Test Scenarios

1. **Free → Starter Upgrade**
   ```bash
   # Use test card: 4242 4242 4242 4242
   # Verify: plan_tier updated, limits increased, invoice created
   ```

2. **Pro → Starter Downgrade**
   ```bash
   # Verify: cancel_at_period_end set, access retained, downgrade at period end
   ```

3. **Failed Payment**
   ```bash
   # Use declined card: 4000 0000 0000 0002
   # Verify: payment_failed_at set, retry_count incremented, user notified
   ```

4. **Usage Limits**
   ```bash
   # Create jobs until limit reached
   # Verify: 403 error with upgradeRequired flag
   ```

5. **Webhook Events**
   ```bash
   # Test each webhook event type
   # Verify: database updates correctly
   ```

## Monitoring

### Key Metrics to Track

1. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Upgrade rate
   - Downgrade rate

2. **Usage Metrics**
   - Feature adoption by tier
   - Limit reach rate
   - Upgrade conversion after limit

3. **Payment Health**
   - Failed payment rate
   - Recovery rate
   - Grace period conversions

### Database Queries

```sql
-- Active subscriptions by tier
SELECT plan_tier, COUNT(*) 
FROM users 
WHERE stripe_subscription_status IN ('active', 'trialing')
GROUP BY plan_tier;

-- Failed payments needing attention
SELECT * FROM users 
WHERE payment_failed_at IS NOT NULL 
  AND payment_failed_at < NOW() - INTERVAL '7 days'
  AND stripe_subscription_status IN ('past_due', 'unpaid');

-- Monthly usage trends
SELECT 
  date_trunc('month', created_at) as month,
  event_type,
  COUNT(*)
FROM usage_events
GROUP BY month, event_type
ORDER BY month DESC;
```

## Security Considerations

1. **Webhook Signature Verification**
   - Always verify Stripe signature
   - Use `stripe.webhooks.constructEvent()`

2. **Price ID Validation**
   - Never trust client-provided price IDs
   - Use server-side configuration

3. **Usage Counter Protection**
   - Use database transactions
   - Prevent race conditions with SELECT FOR UPDATE

4. **PCI Compliance**
   - Never handle card details directly
   - Use Stripe Checkout or Elements
   - Let Stripe handle PCI compliance

## Troubleshooting

### Common Issues

**Issue**: Webhook not receiving events
- **Solution**: Check webhook URL, verify signing secret, check Stripe logs

**Issue**: User still has old limits after upgrade
- **Solution**: Check if webhook processed, verify plan_tier updated, restart session

**Issue**: Failed payment not tracked
- **Solution**: Verify `invoice.payment_failed` event subscribed, check webhook logs

**Issue**: Usage counter not incrementing
- **Solution**: Check API endpoint calls counter update, verify transaction committed

## Future Enhancements

1. **Add-ons**: Extra AI credits, additional team members
2. **Annual discounts**: Larger savings for yearly billing
3. **Metered billing**: Pay-per-use for high-volume features
4. **Referral program**: Credits for successful referrals
5. **Enterprise SSO**: Okta, Azure AD integration
6. **Custom plans**: Negotiated pricing for large teams

# Monetization System Setup Guide

Quick start guide for setting up the HustleDesk billing and pricing system.

## Prerequisites

- Stripe account (test or live mode)
- Supabase project with migrations applied
- Environment variables configured

## Step 1: Run Database Migrations

Apply the monetization migrations:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard
# Run: supabase/migrations/20260216000500_billing_stripe.sql
# Run: supabase/migrations/20260217000100_usage_tracking_and_pricing_tiers.sql
```

Verify tables created:
- `users` table has new columns: `plan_tier`, `billing_interval`, `*_count` fields
- `usage_events` table exists
- `subscription_changes` table exists

## Step 2: Create Stripe Products

### In Stripe Dashboard:

1. **Products** → **Add Product**

2. **Create "Starter" Product:**
   - Name: HustleDesk Starter
   - Description: For growing freelancers
   - **Add Monthly Price**: $29.00/month, Recurring
   - **Add Yearly Price**: $290.00/year, Recurring
   - Copy both Price IDs

3. **Create "Pro" Product:**
   - Name: HustleDesk Pro
   - Description: For established freelancers
   - **Add Monthly Price**: $79.00/month, Recurring
   - **Add Yearly Price**: $790.00/year, Recurring
   - Copy both Price IDs

4. **Create "Enterprise" Product:**
   - Name: HustleDesk Enterprise
   - Description: For teams and agencies
   - **Add Monthly Price**: $299.00/month, Recurring
   - **Add Yearly Price**: $2990.00/year, Recurring
   - Copy both Price IDs

## Step 3: Configure Webhooks

1. **Developers** → **Webhooks** → **Add Endpoint**

2. **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
   - For local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli)
   ```bash
   stripe listen --forward-to localhost:5173/api/payments/webhook
   ```

3. **Select Events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

4. **Copy Webhook Secret** (starts with `whsec_...`)

## Step 4: Update Environment Variables

### Backend (.env):

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...
```

### Frontend (.env.local):

```bash
# Optional - for displaying pricing on frontend
VITE_STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_STARTER_YEARLY=price_...
VITE_STRIPE_PRICE_ID_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_PRO_YEARLY=price_...
VITE_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...
```

### Deployment (Vercel):

Add the same environment variables in:
- **Vercel Dashboard** → **Settings** → **Environment Variables**

## Step 5: Test the Integration

### Test Cards (Stripe Test Mode):

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155
```

### Test Flow:

1. **Sign up for free account**
   ```
   - Visit: /signup
   - Create account
   - Verify plan_tier = 'free'
   ```

2. **Upgrade to Starter**
   ```
   - Go to: /app/settings?tab=billing
   - Click "Upgrade to Starter"
   - Complete Stripe Checkout
   - Verify plan_tier = 'starter'
   - Check invoice created
   ```

3. **Test usage limits**
   ```
   - Create jobs until limit reached
   - Verify 403 error with upgrade prompt
   - Upgrade and verify access granted
   ```

4. **Test failed payment**
   ```
   - Use declining card
   - Verify payment_failed_at set
   - Verify retry_count incremented
   ```

5. **Test webhook events**
   ```
   - Monitor Stripe Dashboard → Developers → Events
   - Verify each event processed correctly
   - Check database updates
   ```

## Step 6: Configure Billing Portal

1. **Stripe Dashboard** → **Settings** → **Billing Portal**

2. **Enable Features**:
   - Update payment method: ✓
   - Update subscription: ✓
   - Cancel subscription: ✓
   - Invoice history: ✓

3. **Business Information**:
   - Add company name
   - Add support email
   - Add terms of service URL
   - Add privacy policy URL

## Step 7: Production Checklist

Before going live:

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update all environment variables with live keys
- [ ] Test with real (small amount) transactions
- [ ] Verify webhook endpoint is reachable from Stripe
- [ ] Enable Stripe email receipts
- [ ] Configure tax collection (if required)
- [ ] Set up revenue recognition (if required)
- [ ] Test failed payment flows
- [ ] Test cancellation flows
- [ ] Set up monitoring/alerts for:
  - Failed payments
  - Webhook errors
  - High churn rate
- [ ] Document customer support procedures
- [ ] Set up billing FAQ/help docs
- [ ] Train support team on billing issues

## Troubleshooting

### Webhook Not Working

**Symptoms**: Subscriptions created but not reflected in app

**Solutions**:
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check Stripe webhook logs for errors
4. Test webhook locally with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Usage Limits Not Enforced

**Symptoms**: Users can exceed limits

**Solutions**:
1. Verify API endpoints call `checkLimit()`
2. Check database schema has counter fields
3. Verify counter increments after resource creation
4. Check plan_tier is correctly set

### Payment Not Processing

**Symptoms**: Card charged but subscription not activated

**Solutions**:
1. Check webhook processed `checkout.session.completed`
2. Verify customer ID linked to user
3. Check subscription ID saved
4. Review Stripe event logs
5. Manually sync subscription:
   ```bash
   # In Stripe CLI
   stripe subscriptions retrieve sub_...
   # Update database manually if needed
   ```

### User Can't Downgrade

**Symptoms**: Downgrade button doesn't work

**Solutions**:
1. Verify `/api/subscriptions/manage` endpoint exists
2. Check user has active subscription
3. Review API error logs
4. Test endpoint directly:
   ```bash
   curl -X POST /api/subscriptions/manage \
     -H "Authorization: Bearer <token>" \
     -d '{"action":"downgrade","tier":"free"}'
   ```

## Monitoring

### Key Metrics Dashboard

Create a dashboard to monitor:

1. **MRR (Monthly Recurring Revenue)**
   ```sql
   SELECT 
     SUM(CASE 
       WHEN plan_tier = 'starter' AND billing_interval = 'monthly' THEN 29
       WHEN plan_tier = 'starter' AND billing_interval = 'yearly' THEN 290/12
       WHEN plan_tier = 'pro' AND billing_interval = 'monthly' THEN 79
       WHEN plan_tier = 'pro' AND billing_interval = 'yearly' THEN 790/12
       WHEN plan_tier = 'enterprise' AND billing_interval = 'monthly' THEN 299
       WHEN plan_tier = 'enterprise' AND billing_interval = 'yearly' THEN 2990/12
       ELSE 0
     END) as mrr
   FROM users
   WHERE stripe_subscription_status IN ('active', 'trialing');
   ```

2. **Churn Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE change_type = 'cancellation' 
       AND created_at >= NOW() - INTERVAL '30 days') * 100.0 / 
     NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) 
       as churn_rate
   FROM subscription_changes;
   ```

3. **Failed Payments**
   ```sql
   SELECT COUNT(*) 
   FROM users 
   WHERE payment_failed_at IS NOT NULL 
     AND stripe_subscription_status IN ('past_due', 'unpaid');
   ```

## Support

For issues:
1. Check [MONETIZATION.md](./MONETIZATION.md) documentation
2. Review Stripe dashboard event logs
3. Check application error logs
4. Test with Stripe CLI in test mode
5. Contact Stripe support for payment processing issues

## Next Steps

After setup:
1. Monitor first few transactions closely
2. Set up automated alerts for failures
3. Create customer billing FAQ
4. Train support team
5. Iterate on pricing based on data
6. Consider adding features like:
   - Annual discount promotions
   - Referral credits
   - Team/volume pricing
   - Add-ons (extra seats, AI credits)

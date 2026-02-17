import { getAuthedUser, getStripe, getSupabaseAdmin, json, parseBody, getRequestOrigin } from '../payments/_shared.js';

const PRICE_IDS = {
  starter_monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY || '',
  starter_yearly: process.env.STRIPE_PRICE_ID_STARTER_YEARLY || '',
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY || '',
};

const getPriceId = (tier, interval) => {
  const key = `${tier}_${interval}`;
  return PRICE_IDS[key] || null;
};

const getTierFromPriceId = (priceId) => {
  for (const [key, value] of Object.entries(PRICE_IDS)) {
    if (value === priceId) {
      const [tier] = key.split('_');
      return tier;
    }
  }
  return null;
};

/**
 * POST /api/subscriptions/manage
 * Body: { action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate', tier?: string, interval?: 'monthly' | 'yearly' }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const body = await parseBody(req);
    const { action, tier, interval } = body;

    if (!action) return json(res, 400, { error: 'Action is required' });

    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    const { data: profile } = await supabase
      .from('users')
      .select('id,email,plan_tier,billing_interval,stripe_customer_id,stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return json(res, 404, { error: 'Profile not found' });

    // Handle different actions
    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        if (!tier || !interval) {
          return json(res, 400, { error: 'Tier and interval are required for upgrade/downgrade' });
        }

        const priceId = getPriceId(tier, interval);
        if (!priceId) {
          return json(res, 400, { error: 'Invalid tier or interval' });
        }

        // Create customer if doesn't exist
        let customerId = profile.stripe_customer_id;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email || profile.email || undefined,
            metadata: { user_id: user.id },
          });
          customerId = customer.id;

          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        }

        // If no existing subscription, create checkout session
        if (!profile.stripe_subscription_id) {
          const origin = getRequestOrigin(req);
          const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/app/settings?tab=billing&checkout=success`,
            cancel_url: `${origin}/app/settings?tab=billing&checkout=cancel`,
            metadata: { user_id: user.id, tier, interval },
            allow_promotion_codes: true,
          });

          return json(res, 200, { url: session.url, message: 'Redirecting to checkout' });
        }

        // Update existing subscription
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        
        // Cancel at period end if downgrading to free
        if (tier === 'free') {
          await stripe.subscriptions.update(profile.stripe_subscription_id, {
            cancel_at_period_end: true,
          });

          await supabase
            .from('subscription_changes')
            .insert({
              user_id: user.id,
              from_plan: profile.plan_tier,
              to_plan: 'free',
              from_interval: profile.billing_interval,
              to_interval: null,
              stripe_subscription_id: profile.stripe_subscription_id,
              change_type: 'downgrade',
              reason: 'User downgraded to free plan',
            });

          return json(res, 200, { 
            success: true, 
            message: 'Subscription will cancel at the end of the billing period' 
          });
        }

        // Update subscription to new price
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'always_invoice',
        });

        // Log the change
        await supabase
          .from('subscription_changes')
          .insert({
            user_id: user.id,
            from_plan: profile.plan_tier,
            to_plan: tier,
            from_interval: profile.billing_interval,
            to_interval: interval,
            stripe_subscription_id: profile.stripe_subscription_id,
            change_type: action,
            reason: `User ${action}d from ${profile.plan_tier} to ${tier}`,
          });

        return json(res, 200, { 
          success: true, 
          message: `Successfully ${action}d to ${tier} plan` 
        });
      }

      case 'cancel': {
        if (!profile.stripe_subscription_id) {
          return json(res, 400, { error: 'No active subscription to cancel' });
        }

        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        await supabase
          .from('subscription_changes')
          .insert({
            user_id: user.id,
            from_plan: profile.plan_tier,
            to_plan: 'free',
            from_interval: profile.billing_interval,
            to_interval: null,
            stripe_subscription_id: profile.stripe_subscription_id,
            change_type: 'cancellation',
            reason: 'User canceled subscription',
          });

        return json(res, 200, { 
          success: true, 
          message: 'Subscription will cancel at the end of the billing period' 
        });
      }

      case 'reactivate': {
        if (!profile.stripe_subscription_id) {
          return json(res, 400, { error: 'No subscription to reactivate' });
        }

        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        
        if (!subscription.cancel_at_period_end) {
          return json(res, 400, { error: 'Subscription is not scheduled for cancellation' });
        }

        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        const currentTier = getTierFromPriceId(subscription.items.data[0].price.id) || 'pro';

        await supabase
          .from('subscription_changes')
          .insert({
            user_id: user.id,
            from_plan: 'free',
            to_plan: currentTier,
            from_interval: null,
            to_interval: profile.billing_interval,
            stripe_subscription_id: profile.stripe_subscription_id,
            change_type: 'reactivation',
            reason: 'User reactivated subscription',
          });

        return json(res, 200, { 
          success: true, 
          message: 'Subscription reactivated successfully' 
        });
      }

      default:
        return json(res, 400, { error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Subscription management error:', err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to manage subscription',
    });
  }
}

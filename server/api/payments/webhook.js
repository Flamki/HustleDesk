import Stripe from 'stripe';
import { getStripe, getSupabaseAdmin, json } from './_shared.js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const isActiveStatus = (status) => ['active', 'trialing'].includes(status);
const isPastDueStatus = (status) => ['past_due', 'unpaid'].includes(status);

const TIER_PRICE_MAP = {
  [process.env.STRIPE_PRICE_ID_PRO_MONTHLY]: 'pro',
  [process.env.STRIPE_PRICE_ID_PRO_YEARLY]: 'pro',
};

const getTierFromSubscription = (subscription) => {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return TIER_PRICE_MAP[priceId] || 'pro'; // fallback to pro for backward compatibility
};

const getIntervalFromSubscription = (subscription) => {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
};

const AI_CREDITS_BY_TIER = {
  free: 5,
  pro: 1000,
};

const readRequestStream = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : null;
};

const getRawBody = async (req) => {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');

  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

  return readRequestStream(req);
};

const syncSubscriptionToUser = async (subscription) => {
  const supabase = getSupabaseAdmin();
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const tier = isActiveStatus(subscription.status) ? getTierFromSubscription(subscription) : 'free';
  const aiLimit = AI_CREDITS_BY_TIER[tier] || 5;
  const interval = getIntervalFromSubscription(subscription);
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const updateData = {
    plan: tier, // backward compatibility
    plan_tier: tier,
    billing_interval: interval,
    ai_credits_limit: aiLimit,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_current_period_end: currentPeriodEnd,
  };

  // Reset payment failure tracking on successful subscription
  if (isActiveStatus(subscription.status)) {
    updateData.payment_failed_at = null;
    updateData.payment_retry_count = 0;
  }

  await supabase
    .from('users')
    .update(updateData)
    .eq('stripe_customer_id', customerId);
};

const syncCheckoutToUser = async (session, stripe) => {
  const supabase = getSupabaseAdmin();
  const userId = session.metadata?.user_id || null;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;

  if (userId && customerId) {
    await supabase
      .from('users')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', userId);
  }

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionToUser(subscription);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!webhookSecret) return json(res, 500, { error: 'Missing STRIPE_WEBHOOK_SECRET' });

  try {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    if (!sig) return json(res, 400, { error: 'Missing stripe-signature header' });

    const rawBody = await getRawBody(req);
    if (!rawBody) return json(res, 400, { error: 'Missing webhook body' });

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          await syncCheckoutToUser(session, stripe);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await syncSubscriptionToUser(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        if (customerId) {
          const supabase = getSupabaseAdmin();
          
          // Get current user to increment retry count
          const { data: user } = await supabase
            .from('users')
            .select('payment_retry_count')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
          
          const retryCount = (user?.payment_retry_count || 0) + 1;
          
          await supabase
            .from('users')
            .update({
              payment_failed_at: new Date().toISOString(),
              payment_retry_count: retryCount,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        if (customerId) {
          const supabase = getSupabaseAdmin();
          
          // Reset payment failure tracking on successful payment
          await supabase
            .from('users')
            .update({
              payment_failed_at: null,
              payment_retry_count: 0,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
      default:
        break;
    }

    return json(res, 200, { received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed';
    return json(res, 400, { error: message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

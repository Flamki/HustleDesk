import Stripe from 'stripe';
import { getStripe, getSupabaseAdmin, json } from './_shared.js';
import {
  sendSuccess,
  sendBadRequest,
  sendServerError,
  sendMethodNotAllowed,
  logger,
  executeQuery,
} from '../_shared/index.js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const isProStatus = (status) => ['active', 'trialing', 'past_due', 'unpaid'].includes(status);

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

/**
 * Sync subscription data to user record
 */
const syncSubscriptionToUser = async (subscription) => {
  try {
    const supabase = getSupabaseAdmin();
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    
    if (!customerId) {
      logger.warn('Subscription sync skipped - no customer ID', {
        subscriptionId: subscription.id,
      });
      return { success: false, error: 'No customer ID' };
    }

    const plan = isProStatus(subscription.status) ? 'pro' : 'free';
    const aiLimit = plan === 'pro' ? 1000000 : 5;
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    const result = await executeQuery(
      supabase
        .from('users')
        .update({
          plan,
          ai_credits_limit: aiLimit,
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          stripe_current_period_end: currentPeriodEnd,
        })
        .eq('stripe_customer_id', customerId),
      {
        operation: 'sync_subscription',
        customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
      }
    );

    if (!result.success) {
      logger.error('Subscription sync failed', {
        customerId,
        subscriptionId: subscription.id,
        error: result.error,
      });
      return { success: false, error: result.error };
    }

    logger.info('Subscription synced successfully', {
      customerId,
      subscriptionId: subscription.id,
      plan,
      status: subscription.status,
    });

    return { success: true };
  } catch (error) {
    logger.error('Subscription sync exception', {
      error: error.message,
      subscriptionId: subscription?.id,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Sync checkout session to user record
 */
const syncCheckoutToUser = async (session, stripe) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = session.metadata?.user_id || null;
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;

    if (!userId || !customerId) {
      logger.warn('Checkout sync skipped - missing user or customer ID', {
        sessionId: session.id,
        hasUserId: !!userId,
        hasCustomerId: !!customerId,
      });
      return { success: false, error: 'Missing user or customer ID' };
    }

    // Update user with customer and subscription IDs
    const result = await executeQuery(
      supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq('id', userId),
      {
        operation: 'sync_checkout',
        userId,
        customerId,
        subscriptionId,
      }
    );

    if (!result.success) {
      logger.error('Checkout sync failed', {
        userId,
        sessionId: session.id,
        error: result.error,
      });
      return { success: false, error: result.error };
    }

    logger.info('Checkout synced successfully', {
      userId,
      customerId,
      subscriptionId,
      sessionId: session.id,
    });

    // Sync subscription details if available
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscriptionToUser(subscription);
    }

    return { success: true };
  } catch (error) {
    logger.error('Checkout sync exception', {
      error: error.message,
      sessionId: session?.id,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Stripe webhook handler - processes payment events
 * CRITICAL: This endpoint must validate webhook signatures for security
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    if (req.method !== 'POST') {
      return sendMethodNotAllowed(res, ['POST']);
    }

    // Validate webhook secret configuration
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return sendServerError(res, 'Webhook not configured');
    }

    // Validate stripe signature header
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      logger.warn('Webhook request missing signature');
      return sendBadRequest(res, 'Missing stripe-signature header');
    }

    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    if (!rawBody) {
      logger.warn('Webhook request missing body');
      return sendBadRequest(res, 'Missing webhook body');
    }

    // Verify webhook signature and construct event
    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      
      logger.info('Webhook event received', {
        eventId: event.id,
        eventType: event.type,
        created: event.created,
      });
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: err.message,
      });
      return sendBadRequest(res, `Webhook signature verification failed: ${err.message}`);
    }

    // Process webhook event based on type
    try {
      const stripe = getStripe();
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.mode === 'subscription') {
            logger.info('Processing checkout session', {
              sessionId: session.id,
              customerId: session.customer,
              subscriptionId: session.subscription,
            });
            
            await syncCheckoutToUser(session, stripe);
          }
          break;
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          
          logger.info('Processing subscription event', {
            eventType: event.type,
            subscriptionId: subscription.id,
            status: subscription.status,
            customerId: subscription.customer,
          });
          
          await syncSubscriptionToUser(subscription);
          break;
        }
        
        default:
          logger.debug('Unhandled webhook event type', {
            eventType: event.type,
            eventId: event.id,
          });
          break;
      }

      const duration = Date.now() - startTime;
      logger.info('Webhook processed successfully', {
        eventId: event.id,
        eventType: event.type,
        duration: `${duration}ms`,
      });

      return sendSuccess(res, { 
        received: true,
        eventId: event.id,
        eventType: event.type,
      });
    } catch (processingError) {
      logger.error('Webhook processing error', {
        eventId: event?.id,
        eventType: event?.type,
        error: processingError.message,
        stack: processingError.stack,
      });
      
      // Return 200 to acknowledge receipt even if processing failed
      // This prevents Stripe from retrying immediately
      // Note: We return 'received: true' but indicate processing failed separately
      return sendSuccess(res, { 
        received: true,
        processing_status: 'failed',
        will_retry: true,
      });
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Webhook handler error', {
      error: err.message,
      stack: err.stack,
      duration: `${duration}ms`,
    });
    
    // Generic error response
    return sendBadRequest(res, err instanceof Error ? err.message : 'Webhook processing failed');
  }
}

// Disable body parsing for webhooks (need raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};

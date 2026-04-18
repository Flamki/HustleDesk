import crypto from 'node:crypto';
import { getRazorpayConfig, getSupabaseAdmin, json } from './_shared.js';

const isPaidStatus = (status) => ['captured', 'authorized'].includes(String(status || '').toLowerCase());

const readRawBody = async (req) => {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
};

const updateUserPlanFromPayment = async (paymentEntity) => {
  const userId = String(paymentEntity?.notes?.user_id || '').trim();
  if (!userId) return;

  const paid = isPaidStatus(paymentEntity.status);
  const supabase = getSupabaseAdmin();

  await supabase
    .from('users')
    .update({
      plan: paid ? 'pro' : 'free',
      ai_credits_limit: paid ? 1000000 : 5,
    })
    .eq('id', userId);

  try {
    await supabase
      .from('users')
      .update({
        razorpay_customer_id: paymentEntity.customer_id || null,
        razorpay_last_order_id: paymentEntity.order_id || null,
        razorpay_last_payment_id: paymentEntity.id || null,
        razorpay_last_payment_status: paymentEntity.status || null,
      })
      .eq('id', userId);
  } catch {
    // Ignore if optional Razorpay metadata columns are not yet migrated.
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { webhookSecret } = getRazorpayConfig();
    if (!webhookSecret) return json(res, 500, { error: 'Missing RAZORPAY_WEBHOOK_SECRET' });

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return json(res, 400, { error: 'Missing x-razorpay-signature header' });

    const rawBody = await readRawBody(req);
    if (!rawBody.length) return json(res, 400, { error: 'Missing webhook body' });

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      return json(res, 400, { error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const paymentEntity = payload?.payload?.payment?.entity;

    if (paymentEntity && (payload.event === 'payment.captured' || payload.event === 'order.paid')) {
      await updateUserPlanFromPayment(paymentEntity);
    }

    return json(res, 200, { received: true });
  } catch (err) {
    return json(res, 400, {
      error: err instanceof Error ? err.message : 'Webhook processing failed',
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

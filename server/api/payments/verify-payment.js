import crypto from 'node:crypto';
import {
  callRazorpayApi,
  getAuthedUser,
  getRazorpayConfig,
  getSupabaseAdmin,
  json,
  parseBody,
} from './_shared.js';

const isPaidStatus = (status) => ['captured', 'authorized'].includes(String(status || '').toLowerCase());

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const body = await parseBody(req);
    const orderId = String(body?.razorpay_order_id || '').trim();
    const paymentId = String(body?.razorpay_payment_id || '').trim();
    const signature = String(body?.razorpay_signature || '').trim();

    if (!orderId || !paymentId || !signature) {
      return json(res, 400, { error: 'Missing payment verification fields' });
    }

    const config = getRazorpayConfig();
    const expected = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expected !== signature) {
      return json(res, 400, { error: 'Invalid Razorpay payment signature' });
    }

    const payment = await callRazorpayApi(`/payments/${paymentId}`);
    const paid = isPaidStatus(payment.status);

    const supabase = getSupabaseAdmin();
    await supabase
      .from('users')
      .update({
        plan: paid ? 'pro' : 'free',
        ai_credits_limit: paid ? 1000000 : 5,
      })
      .eq('id', user.id);

    // Optional metadata columns may not exist on all environments yet.
    try {
      await supabase
        .from('users')
        .update({
          razorpay_customer_id: payment.customer_id || null,
          razorpay_last_order_id: orderId,
          razorpay_last_payment_id: paymentId,
          razorpay_last_payment_status: payment.status || null,
        })
        .eq('id', user.id);
    } catch {
      // Ignore if optional Razorpay metadata columns are not yet migrated.
    }

    return json(res, 200, {
      success: paid,
      status: payment.status,
      payment_id: paymentId,
      order_id: orderId,
    });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to verify payment',
    });
  }
}

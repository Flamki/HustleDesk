import {
  callRazorpayApi,
  getAuthedUser,
  getRequestOrigin,
  getRazorpayConfig,
  getSupabaseAdmin,
  json,
  parseBody,
} from './_shared.js';

const clampAmount = (amountMinor) => {
  const numeric = Number.parseInt(String(amountMinor || ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return 900;
  return Math.min(100000000, numeric);
};

const buildReceipt = (userId) => {
  const cleanUser = String(userId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 14) || 'user';
  const stamp = Date.now().toString(36);
  return `gsd_${cleanUser}_${stamp}`.slice(0, 40);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const supabase = getSupabaseAdmin();
    const config = getRazorpayConfig();
    const body = await parseBody(req);

    const { data: profile } = await supabase
      .from('users')
      .select('id,email')
      .eq('id', user.id)
      .maybeSingle();

    const customer = await callRazorpayApi('/customers', {
      method: 'POST',
      body: {
        name: (String(user.email || profile?.email || '').split('@')[0] || 'GetSoloDesk User').slice(0, 100),
        email: user.email || profile?.email || undefined,
        fail_existing: 0,
        notes: { user_id: user.id },
      },
    });
    const customerId = customer?.id || null;

    const requestedCurrency = String(body?.currency || '').trim().toUpperCase();
    const currency = requestedCurrency || config.currency;
    const amountMinor = clampAmount(body?.amountMinor || config.amountMinor);
    const origin = getRequestOrigin(req);

    const order = await callRazorpayApi('/orders', {
      method: 'POST',
      body: {
        amount: amountMinor,
        currency,
        receipt: buildReceipt(user.id),
        notes: {
          user_id: user.id,
          user_email: user.email || profile?.email || '',
          plan: 'pro',
        },
      },
    });

    return json(res, 200, {
      provider: 'razorpay',
      keyId: config.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || currency,
      name: 'GetSoloDesk',
      description: config.planName,
      prefill: {
        email: user.email || profile?.email || undefined,
      },
      successUrl: `${origin}/app/settings?tab=billing&checkout=success`,
      cancelUrl: `${origin}/app/settings?tab=billing&checkout=cancel`,
      customerId,
    });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to create Razorpay order',
    });
  }
}

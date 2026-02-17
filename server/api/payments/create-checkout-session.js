import {
  getAuthedUser,
  getRequestOrigin,
  getStripe,
  getSupabaseAdmin,
  json,
} from './_shared.js';

const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!PRO_PRICE_ID) return json(res, 500, { error: 'Missing STRIPE_PRICE_ID_PRO_MONTHLY' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    const { data: profile } = await supabase
      .from('users')
      .select('id,email,stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const origin = getRequestOrigin(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/app/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/app/settings?tab=billing&checkout=cancel`,
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
    });

    return json(res, 200, { url: session.url });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to create checkout session',
    });
  }
}

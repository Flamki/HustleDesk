import {
  getAuthedUser,
  getRequestOrigin,
  getStripe,
  getSupabaseAdmin,
  json,
} from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return json(res, 400, { error: 'No billing customer found. Start subscription first.' });
    }

    const origin = getRequestOrigin(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/app/settings?tab=billing`,
    });

    return json(res, 200, { url: session.url });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to create portal session',
    });
  }
}

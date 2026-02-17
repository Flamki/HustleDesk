import { getAuthedUser, getStripe, getSupabaseAdmin, json } from './_shared.js';

const normalizeStatus = (status) => {
  if (!status) return 'Open';
  if (status === 'paid') return 'Paid';
  if (status === 'open') return 'Open';
  if (status === 'void') return 'Void';
  if (status === 'uncollectible') return 'Failed';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (unixTs) => {
  if (!unixTs) return '';
  return new Date(unixTs * 1000).toLocaleDateString();
};

const formatAmount = (amountCents, currency) => {
  const amount = Number(amountCents || 0) / 100;
  return `${currency?.toUpperCase?.() || 'USD'} ${amount.toFixed(2)}`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

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
      return json(res, 200, { invoices: [] });
    }

    const list = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 30,
    });

    const invoices = list.data.map((inv) => ({
      id: inv.number || inv.id,
      plan: inv.lines?.data?.[0]?.description || 'Subscription',
      date: formatDate(inv.created),
      amount: formatAmount(inv.amount_paid || inv.amount_due, inv.currency),
      status: normalizeStatus(inv.status),
      hosted_invoice_url: inv.hosted_invoice_url || null,
      invoice_pdf: inv.invoice_pdf || null,
    }));

    return json(res, 200, { invoices });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to fetch invoices',
    });
  }
}


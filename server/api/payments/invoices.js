import { callRazorpayApi, getAuthedUser, json } from './_shared.js';

const normalizeStatus = (status) => {
  if (!status) return 'Open';
  if (status === 'captured') return 'Paid';
  if (status === 'created') return 'Open';
  if (status === 'authorized') return 'Authorized';
  if (status === 'refunded') return 'Refunded';
  if (status === 'failed') return 'Failed';
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

    const list = await callRazorpayApi('/payments?count=100');
    const allPayments = Array.isArray(list?.items) ? list.items : [];
    const email = String(user.email || '').toLowerCase();

    const invoices = allPayments
      .filter((payment) => {
        const userIdNote = String(payment?.notes?.user_id || '');
        const paymentEmail = String(payment?.email || '').toLowerCase();
        return userIdNote === user.id || (email && paymentEmail === email);
      })
      .sort((a, b) => Number(b?.created_at || 0) - Number(a?.created_at || 0))
      .slice(0, 30)
      .map((payment) => ({
        id: payment.id,
        plan: String(payment?.notes?.plan || '').toLowerCase() === 'pro' ? 'Pro Plan' : 'Payment',
        date: formatDate(payment.created_at),
        amount: formatAmount(payment.amount, payment.currency),
        status: normalizeStatus(payment.status),
        hosted_invoice_url: null,
        invoice_pdf: null,
    }));

    return json(res, 200, { invoices });
  } catch (err) {
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to fetch invoices',
    });
  }
}


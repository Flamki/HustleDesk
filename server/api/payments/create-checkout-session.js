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

const parsePromoCatalog = (raw) => {
  if (!raw) return {};
  const trimmed = String(raw || '').trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    // Fallback format: CODE:10,CODE2:25 (percent values)
    const out = {};
    for (const pair of trimmed.split(',')) {
      const [codeRaw, valueRaw] = pair.split(':');
      const code = String(codeRaw || '').trim().toUpperCase();
      const value = Number.parseFloat(String(valueRaw || '').trim());
      if (!code || !Number.isFinite(value) || value <= 0) continue;
      out[code] = { type: 'percent', value };
    }
    return out;
  }
};

const normalizePromoCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);

const resolvePromoRule = (catalog, code) => {
  if (!code || !catalog || typeof catalog !== 'object') return null;
  const raw = catalog[code];
  if (!raw) return null;

  if (typeof raw === 'number') {
    return { active: true, type: 'percent', value: raw };
  }
  if (typeof raw === 'string') {
    const asPercent = Number.parseFloat(raw.replace('%', '').trim());
    if (!Number.isFinite(asPercent)) return null;
    return { active: true, type: 'percent', value: asPercent };
  }
  if (typeof raw === 'object') {
    const type = String(raw.type || 'percent').trim().toLowerCase();
    const value = Number.parseFloat(String(raw.value || '0'));
    const active = raw.active !== false;
    const minAmountMinor = Number.parseInt(String(raw.min_amount_minor || '0'), 10) || 0;
    const maxDiscountMinor = Number.parseInt(String(raw.max_discount_minor || '0'), 10) || 0;
    const description = String(raw.description || '').trim();
    if (!Number.isFinite(value) || value <= 0) return null;
    if (type !== 'percent' && type !== 'amount_minor') return null;
    return { active, type, value, minAmountMinor, maxDiscountMinor, description };
  }
  return null;
};

const applyPromoCode = (baseAmountMinor, promoCodeRaw, promoCatalogRaw) => {
  const promoCode = normalizePromoCode(promoCodeRaw);
  if (!promoCode) {
    return {
      finalAmountMinor: baseAmountMinor,
      discountAmountMinor: 0,
      promoCodeApplied: null,
      promoDescription: null,
    };
  }

  const catalog = parsePromoCatalog(promoCatalogRaw);
  const rule = resolvePromoRule(catalog, promoCode);
  if (!rule || !rule.active) throw new Error('Invalid promo code');

  if (rule.minAmountMinor && baseAmountMinor < rule.minAmountMinor) {
    throw new Error('Promo code minimum amount not met');
  }

  let discountAmountMinor =
    rule.type === 'percent'
      ? Math.round((baseAmountMinor * rule.value) / 100)
      : Math.round(rule.value);

  if (rule.maxDiscountMinor) {
    discountAmountMinor = Math.min(discountAmountMinor, rule.maxDiscountMinor);
  }

  discountAmountMinor = Math.max(0, Math.min(discountAmountMinor, baseAmountMinor - 1));
  if (discountAmountMinor <= 0) throw new Error('Invalid promo code');

  return {
    finalAmountMinor: Math.max(1, baseAmountMinor - discountAmountMinor),
    discountAmountMinor,
    promoCodeApplied: promoCode,
    promoDescription: rule.description || null,
  };
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

    const currency = config.currency;
    const baseAmountMinor = clampAmount(config.amountMinor);
    const pricing = applyPromoCode(
      baseAmountMinor,
      body?.promoCode,
      process.env.RAZORPAY_PROMO_CODES_JSON || process.env.RAZORPAY_PROMO_CODES || ''
    );
    const origin = getRequestOrigin(req);

    const order = await callRazorpayApi('/orders', {
      method: 'POST',
      body: {
        amount: pricing.finalAmountMinor,
        currency,
        receipt: buildReceipt(user.id),
        notes: {
          user_id: user.id,
          user_email: user.email || profile?.email || '',
          plan: 'pro',
          promo_code: pricing.promoCodeApplied || '',
          promo_discount_minor: String(pricing.discountAmountMinor || 0),
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
      pricing: {
        baseAmountMinor,
        discountAmountMinor: pricing.discountAmountMinor,
        finalAmountMinor: pricing.finalAmountMinor,
        promoCodeApplied: pricing.promoCodeApplied,
        promoDescription: pricing.promoDescription,
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

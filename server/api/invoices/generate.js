import { secureJson } from '../_shared/security.js';
import { extractBearerToken } from '../_shared/auth.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// ═══════════════════════════════════════════════════════════
// Client Invoice PDF Generator
// Generates a professional PDF invoice that freelancers
// can send to their clients.
// ═══════════════════════════════════════════════════════════

const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatCurrency = (amount, currency = 'USD') => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const generateInvoiceHtml = (invoice) => {
  const {
    invoiceNumber,
    date,
    dueDate,
    fromName,
    fromEmail,
    fromAddress,
    toName,
    toEmail,
    toAddress,
    items,
    currency = 'USD',
    notes,
    paymentInfo,
  } = invoice;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxRate = invoice.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const itemsHtml = items
    .map(
      (item, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; color: #334155; font-size: 14px;">${escapeHtml(item.description)}</td>
        <td style="padding: 12px 16px; color: #64748b; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 12px 16px; color: #64748b; text-align: right; font-size: 14px;">${formatCurrency(item.rate, currency)}</td>
        <td style="padding: 12px 16px; color: #334155; text-align: right; font-size: 14px; font-weight: 600;">${formatCurrency(item.quantity * item.rate, currency)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; padding: 48px 40px;">

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px;">
      <div>
        <h1 style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">INVOICE</h1>
        <p style="font-size: 14px; color: #64748b; margin-top: 4px;">${escapeHtml(invoiceNumber)}</p>
      </div>
      <div style="text-align: right;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          ${dueDate && new Date(dueDate) < new Date() ? 'OVERDUE' : 'DUE'}
        </div>
      </div>
    </div>

    <!-- Dates + Parties -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
      <div style="flex: 1;">
        <div style="margin-bottom: 24px;">
          <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Issue Date</p>
          <p style="font-size: 14px; color: #334155; font-weight: 500;">${escapeHtml(date)}</p>
        </div>
        ${dueDate ? `
        <div>
          <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Due Date</p>
          <p style="font-size: 14px; color: #334155; font-weight: 500;">${escapeHtml(dueDate)}</p>
        </div>` : ''}
      </div>

      <div style="flex: 1;">
        <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">From</p>
        <p style="font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(fromName)}</p>
        ${fromEmail ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(fromEmail)}</p>` : ''}
        ${fromAddress ? `<p style="font-size: 13px; color: #64748b; margin-top: 4px; white-space: pre-line;">${escapeHtml(fromAddress)}</p>` : ''}
      </div>

      <div style="flex: 1; text-align: right;">
        <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Bill To</p>
        <p style="font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(toName)}</p>
        ${toEmail ? `<p style="font-size: 13px; color: #64748b;">${escapeHtml(toEmail)}</p>` : ''}
        ${toAddress ? `<p style="font-size: 13px; color: #64748b; margin-top: 4px; white-space: pre-line;">${escapeHtml(toAddress)}</p>` : ''}
      </div>
    </div>

    <!-- Line Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Description</th>
          <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Rate</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
      <div style="width: 280px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 14px; color: #64748b;">Subtotal</span>
          <span style="font-size: 14px; color: #334155; font-weight: 500;">${formatCurrency(subtotal, currency)}</span>
        </div>
        ${taxRate > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          <span style="font-size: 14px; color: #64748b;">Tax (${taxRate}%)</span>
          <span style="font-size: 14px; color: #334155; font-weight: 500;">${formatCurrency(taxAmount, currency)}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 4px; border-top: 2px solid #0f172a;">
          <span style="font-size: 16px; font-weight: 700; color: #0f172a;">Total Due</span>
          <span style="font-size: 16px; font-weight: 700; color: #0f172a;">${formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>

    ${paymentInfo ? `
    <!-- Payment Info -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Payment Information</p>
      <p style="font-size: 14px; color: #334155; white-space: pre-line;">${escapeHtml(paymentInfo)}</p>
    </div>` : ''}

    ${notes ? `
    <!-- Notes -->
    <div style="margin-bottom: 24px;">
      <p style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Notes</p>
      <p style="font-size: 14px; color: #64748b; white-space: pre-line;">${escapeHtml(notes)}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8;">Generated with GetSoloDesk — getsolodesk.com</p>
    </div>

  </div>
</body>
</html>`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });

  const token = extractBearerToken(req);
  if (!token) return secureJson(res, 401, { error: 'Unauthorized' });

  // Verify user
  if (url && anonKey) {
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { error } = await supabase.auth.getUser();
    if (error) return secureJson(res, 401, { error: 'Unauthorized' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return secureJson(res, 400, { error: 'Invalid JSON body' });
  }

  // Validate required fields
  const { invoiceNumber, fromName, toName, items } = body || {};
  if (!invoiceNumber) return secureJson(res, 400, { error: 'Invoice number is required' });
  if (!fromName) return secureJson(res, 400, { error: 'Your name is required' });
  if (!toName) return secureJson(res, 400, { error: 'Client name is required' });
  if (!Array.isArray(items) || items.length === 0) return secureJson(res, 400, { error: 'At least one line item is required' });

  for (const item of items) {
    if (!item.description) return secureJson(res, 400, { error: 'Line item description is required' });
    if (!item.quantity || item.quantity <= 0) return secureJson(res, 400, { error: 'Line item quantity must be positive' });
    if (item.rate === undefined || item.rate < 0) return secureJson(res, 400, { error: 'Line item rate must be non-negative' });
  }

  const html = generateInvoiceHtml({
    invoiceNumber,
    date: body.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dueDate: body.dueDate || '',
    fromName,
    fromEmail: body.fromEmail || '',
    fromAddress: body.fromAddress || '',
    toName,
    toEmail: body.toEmail || '',
    toAddress: body.toAddress || '',
    items,
    currency: body.currency || 'USD',
    taxRate: body.taxRate || 0,
    notes: body.notes || '',
    paymentInfo: body.paymentInfo || '',
  });

  // Return HTML that can be printed to PDF via browser
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
}

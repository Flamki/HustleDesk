import React, { useState } from 'react';
import {
  DollarSign,
  FileText,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD'];

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const newLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  rate: 0,
});

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString(36).toUpperCase()}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('USD');

  // From (freelancer)
  const [fromName, setFromName] = useState(user?.email?.split('@')[0] || '');
  const [fromEmail, setFromEmail] = useState(user?.email || '');
  const [fromAddress, setFromAddress] = useState('');

  // To (client)
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toAddress, setToAddress] = useState('');

  // Line items
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('Thank you for your business!');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addItem = () => setItems((prev) => [...prev, newLineItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleGenerate = async () => {
    if (!fromName.trim()) { showToast({ variant: 'error', message: 'Your name is required' }); return; }
    if (!toName.trim()) { showToast({ variant: 'error', message: 'Client name is required' }); return; }
    if (items.length === 0) { showToast({ variant: 'error', message: 'Add at least one line item' }); return; }
    const emptyItem = items.find((i) => !i.description.trim());
    if (emptyItem) { showToast({ variant: 'error', message: 'All line items need a description' }); return; }

    setIsGenerating(true);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber,
          date: new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          dueDate: dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          fromName, fromEmail, fromAddress,
          toName, toEmail, toAddress,
          items: items.map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate })),
          currency,
          taxRate,
          notes,
          paymentInfo,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate invoice' }));
        showToast({ variant: 'error', message: err.error || 'Failed to generate invoice' });
        return;
      }

      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      showToast({ variant: 'success', message: 'Invoice generated! Use Ctrl+P to save as PDF.' });
    } catch {
      showToast({ variant: 'error', message: 'Failed to generate invoice' });
    } finally {
      setIsGenerating(false);
    }
  };

  const sectionLabel = 'text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3';
  const cardClass = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-500" />
            Invoice Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Create professional invoices and save as PDF
          </p>
        </div>
        <button
          onClick={() => { void handleGenerate(); }}
          disabled={isGenerating}
          className="hd-btn-primary px-6 py-3 flex items-center gap-2"
        >
          <Printer size={18} />
          {isGenerating ? 'Generating...' : 'Generate & Print'}
        </button>
      </div>

      {/* Invoice Number + Dates */}
      <div className={cardClass}>
        <p className={sectionLabel}>Invoice Details</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <p className={sectionLabel}>From (You)</p>
          <div className="space-y-3">
            <Input label="Name" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your full name" />
            <Input label="Email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="you@email.com" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <textarea value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} rows={2} placeholder="Street, City, Country"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
            </div>
          </div>
        </div>
        <div className={cardClass}>
          <p className={sectionLabel}>Bill To (Client)</p>
          <div className="space-y-3">
            <Input label="Client Name" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Client or company name" />
            <Input label="Client Email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="client@email.com" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <textarea value={toAddress} onChange={(e) => setToAddress(e.target.value)} rows={2} placeholder="Street, City, Country"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <p className={sectionLabel + ' mb-0'}>Line Items</p>
          <button onClick={addItem} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="e.g. Website redesign" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div className="col-span-2">
                <input type="number" min="0.01" step="0.01" value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-indigo-500 text-center" />
              </div>
              <div className="col-span-2">
                <input type="number" min="0" step="0.01" value={item.rate || ''} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-indigo-500 text-right" />
              </div>
              <div className="col-span-2 text-right text-sm font-semibold text-slate-900 dark:text-white">
                {formatCurrency(item.quantity * item.rate, currency)}
              </div>
              <div className="col-span-1 flex justify-center">
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm items-center gap-3">
                <span className="text-slate-500">Tax (%)</span>
                <input type="number" min="0" max="100" step="0.5" value={taxRate || ''} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-2 py-1 text-sm text-right outline-none focus:border-indigo-500" />
                <span className="font-medium text-slate-900 dark:text-white w-24 text-right">{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t-2 border-slate-900 dark:border-white">
                <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign size={16} /> Total
                </span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <p className={sectionLabel}>Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Thank you for your business!"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
        </div>
        <div className={cardClass}>
          <p className={sectionLabel}>Payment Information</p>
          <textarea value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} rows={3}
            placeholder="Bank: Example Bank&#10;Account: 1234567890&#10;PayPal: you@email.com"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex justify-end pb-8">
        <button
          onClick={() => { void handleGenerate(); }}
          disabled={isGenerating}
          className="px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Printer size={18} />
          {isGenerating ? 'Generating...' : 'Generate Invoice & Print'}
        </button>
      </div>
    </div>
  );
};

export default InvoicesPage;

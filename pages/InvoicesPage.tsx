import React, { useMemo, useState } from 'react';
import { DollarSign, FileText, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../components/ui';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD'];
const STORAGE_KEY = 'gsd_invoices_v1';

interface LineItem { id: string; description: string; quantity: number; rate: number; }
interface InvoiceDraft {
  id: string; invoiceNumber: string; date: string; dueDate: string; currency: string;
  fromName: string; fromEmail: string; fromAddress: string;
  toName: string; toEmail: string; toAddress: string;
  items: LineItem[]; taxRate: number; notes: string; paymentInfo: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'; createdAt: string;
}

const newLineItem = (): LineItem => ({ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 });
const loadInvoices = (): InvoiceDraft[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const saveInvoices = (list: InvoiceDraft[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const fmt = (amount: number, currency: string) => {
  const s: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' };
  return `${s[currency] || currency + ' '}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const statusStyles: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceDraft[]>(loadInvoices);
  const [editing, setEditing] = useState<InvoiceDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Sent' | 'Paid' | 'Overdue'>('All');

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (statusFilter !== 'All') list = list.filter((i) => i.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.toName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, statusFilter, searchQuery]);

  const createNew = () => {
    const inv: InvoiceDraft = {
      id: crypto.randomUUID(),
      invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      currency: 'USD',
      fromName: user?.email?.split('@')[0] || '',
      fromEmail: user?.email || '',
      fromAddress: '',
      toName: '',
      toEmail: '',
      toAddress: '',
      items: [newLineItem()],
      taxRate: 0,
      notes: 'Thank you for your business!',
      paymentInfo: '',
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
    const updated = [inv, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    setEditing(inv);
  };

  const update = (patch: Partial<InvoiceDraft>) => {
    if (!editing) return;
    const merged = { ...editing, ...patch };
    setEditing(merged);
    const updated = invoices.map((i) => (i.id === merged.id ? merged : i));
    setInvoices(updated);
    saveInvoices(updated);
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter((i) => i.id !== id);
    setInvoices(updated);
    saveInvoices(updated);
    if (editing?.id === id) setEditing(null);
    showToast({ variant: 'success', message: 'Invoice deleted' });
  };

  const printInvoice = async () => {
    if (!editing) return;
    try {
      const { data: sd } = await supabase!.auth.getSession();
      const token = sd?.session?.access_token;
      const inv = editing;
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: inv.invoiceNumber,
          date: new Date(inv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          fromName: inv.fromName, fromEmail: inv.fromEmail, fromAddress: inv.fromAddress,
          toName: inv.toName, toEmail: inv.toEmail, toAddress: inv.toAddress,
          items: inv.items.map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate })),
          currency: inv.currency, taxRate: inv.taxRate, notes: inv.notes, paymentInfo: inv.paymentInfo,
        }),
      });
      if (!response.ok) { showToast({ variant: 'error', message: 'Failed to generate' }); return; }
      const html = await response.text();
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    } catch { showToast({ variant: 'error', message: 'Failed to generate invoice' }); }
  };

  const subtotal = editing ? editing.items.reduce((s, i) => s + i.quantity * i.rate, 0) : 0;
  const taxAmt = subtotal * ((editing?.taxRate || 0) / 100);
  const total = subtotal + taxAmt;

  const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30';
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  /* ─── EDITOR VIEW ─── */
  if (editing) {
    return (
      <div className="space-y-5 pb-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(null)} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
            ← Back to invoices
          </button>
          <div className="flex items-center gap-2">
            <select value={editing.status} onChange={(e) => update({ status: e.target.value as InvoiceDraft['status'] })}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white px-3 py-2 text-xs font-semibold outline-none">
              <option value="Draft">Draft</option><option value="Sent">Sent</option>
              <option value="Paid">Paid</option><option value="Overdue">Overdue</option>
            </select>
            <button onClick={() => { void printInvoice(); }}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition-all">
              <Printer size={16} /> Print / PDF
            </button>
          </div>
        </div>

        {/* Header bar */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">Invoice {editing.invoiceNumber}</p>
              <p className="text-sm text-indigo-100 mt-0.5">{editing.toName || 'New Invoice'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{fmt(total, editing.currency)}</p>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyles[editing.status]}`}>{editing.status}</span>
            </div>
          </div>
        </div>

        {/* Invoice details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {/* Row 1: Invoice # / Date / Due / Currency */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={labelCls}>Invoice #</label><input value={editing.invoiceNumber} onChange={(e) => update({ invoiceNumber: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Date</label><input type="date" value={editing.date} onChange={(e) => update({ date: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Due Date</label><input type="date" value={editing.dueDate} onChange={(e) => update({ dueDate: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Currency</label><select value={editing.currency} onChange={(e) => update({ currency: e.target.value })} className={inputCls}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className={labelCls}>From (You)</p>
              <input value={editing.fromName} onChange={(e) => update({ fromName: e.target.value })} placeholder="Your name" className={inputCls} />
              <input value={editing.fromEmail} onChange={(e) => update({ fromEmail: e.target.value })} placeholder="Email" className={inputCls} />
              <textarea value={editing.fromAddress} onChange={(e) => update({ fromAddress: e.target.value })} placeholder="Address" rows={2} className={inputCls + ' resize-none'} />
            </div>
            <div className="space-y-3">
              <p className={labelCls}>Bill To (Client)</p>
              <input value={editing.toName} onChange={(e) => update({ toName: e.target.value })} placeholder="Client name" className={inputCls} />
              <input value={editing.toEmail} onChange={(e) => update({ toEmail: e.target.value })} placeholder="Client email" className={inputCls} />
              <textarea value={editing.toAddress} onChange={(e) => update({ toAddress: e.target.value })} placeholder="Address" rows={2} className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={labelCls + ' mb-0'}>Line Items</p>
              <button onClick={() => update({ items: [...editing.items, newLineItem()] })} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <div className="col-span-5">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">Rate</div><div className="col-span-2 text-right">Amount</div><div className="col-span-1" />
              </div>
              {editing.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5"><input value={item.description} onChange={(e) => update({ items: editing.items.map((i) => i.id === item.id ? { ...i, description: e.target.value } : i) })} placeholder="Description" className={inputCls} /></div>
                  <div className="col-span-2"><input type="number" min="0.01" step="0.01" value={item.quantity || ''} onChange={(e) => update({ items: editing.items.map((i) => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i) })} className={inputCls + ' text-center'} /></div>
                  <div className="col-span-2"><input type="number" min="0" step="0.01" value={item.rate || ''} onChange={(e) => update({ items: editing.items.map((i) => i.id === item.id ? { ...i, rate: parseFloat(e.target.value) || 0 } : i) })} className={inputCls + ' text-right'} /></div>
                  <div className="col-span-2 text-right text-sm font-bold text-slate-900 dark:text-white">{fmt(item.quantity * item.rate, editing.currency)}</div>
                  <div className="col-span-1 flex justify-center">{editing.items.length > 1 && <button onClick={() => update({ items: editing.items.filter((i) => i.id !== item.id) })} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900 dark:text-white">{fmt(subtotal, editing.currency)}</span></div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-slate-500">Tax (%)</span>
                  <input type="number" min="0" max="100" step="0.5" value={editing.taxRate || ''} onChange={(e) => update({ taxRate: parseFloat(e.target.value) || 0 })} className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white px-2 py-1 text-sm text-right outline-none" />
                  <span className="font-medium text-slate-900 dark:text-white w-20 text-right">{fmt(taxAmt, editing.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-slate-900 dark:border-white">
                  <span className="text-slate-900 dark:text-white flex items-center gap-1"><DollarSign size={14} /> Total</span>
                  <span className="text-slate-900 dark:text-white">{fmt(total, editing.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Notes</label><textarea value={editing.notes} onChange={(e) => update({ notes: e.target.value })} rows={3} className={inputCls + ' resize-none'} /></div>
            <div><label className={labelCls}>Payment Info</label><textarea value={editing.paymentInfo} onChange={(e) => update({ paymentInfo: e.target.value })} rows={3} placeholder="Bank details, PayPal, etc." className={inputCls + ' resize-none'} /></div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LIST VIEW ─── */
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={28} className="text-indigo-500" /> Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create, track, and manage client invoices.</p>
        </div>
        <button onClick={createNew} className="px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm" />
        </div>
        <div className="flex gap-2">
          {(['All', 'Draft', 'Sent', 'Paid', 'Overdue'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4"><FileText size={32} /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No invoices yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Create professional invoices, track payment status, and print as PDF.</p>
          <button onClick={createNew} className="mt-6 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2">
            <Plus size={18} /> Create Your First Invoice
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inv) => {
            const t = inv.items.reduce((s, i) => s + i.quantity * i.rate, 0) * (1 + (inv.taxRate || 0) / 100);
            return (
              <button key={inv.id} onClick={() => setEditing(inv)}
                className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0"><FileText size={20} /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{inv.toName || 'No client'} &bull; {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-slate-900 dark:text-white">{fmt(t, inv.currency)}</p>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyles[inv.status]}`}>{inv.status}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteInvoice(inv.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Delete"><X size={14} /></button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;

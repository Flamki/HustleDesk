import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Mail, Plus, Upload, Users, Send, Search, Loader2, X } from 'lucide-react';
import { MarketingCampaign, MarketingContact } from '../types';
import { supabase } from '../services/supabaseClient';

const getToken = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const parseCsv = (text: string): Array<Record<string, string>> => {
  // Minimal CSV parser supporting quotes. Good enough for simple imports.
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      cell += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
      continue;
    }
    if (ch === '\r') continue;
    cell += ch;
  }
  row.push(cell);
  rows.push(row);

  const header = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  const out: Array<Record<string, string>> = [];
  for (const r of rows) {
    if (r.every((c) => !String(c || '').trim())) continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) obj[header[i] || `col_${i}`] = String(r[i] ?? '').trim();
    out.push(obj);
  }
  return out;
};

const mapContact = (row: any): MarketingContact => ({
  id: row.id,
  userId: row.user_id,
  email: row.email,
  firstName: row.first_name ?? null,
  lastName: row.last_name ?? null,
  company: row.company ?? null,
  tags: Array.isArray(row.tags) ? row.tags : [],
  status: row.status,
  subscribedAt: row.subscribed_at,
  unsubscribedAt: row.unsubscribed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCampaign = (row: any): MarketingCampaign => ({
  id: row.id,
  userId: row.user_id,
  name: row.name || '',
  subject: row.subject || '',
  fromName: row.from_name || '',
  fromEmail: row.from_email || '',
  replyTo: row.reply_to ?? null,
  bodyText: row.body_text || '',
  bodyHtml: row.body_html || '',
  status: row.status,
  audienceTag: row.audience_tag ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sentAt: row.sent_at ?? null,
});

export const EmailMarketingPage: React.FC = () => {
  const [tab, setTab] = useState<'contacts' | 'campaigns' | 'compose'>('contacts');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  const [composeName, setComposeName] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeFromName, setComposeFromName] = useState('');
  const [composeFromEmail, setComposeFromEmail] = useState('');
  const [composeReplyTo, setComposeReplyTo] = useState('');
  const [composeAudienceTag, setComposeAudienceTag] = useState('');
  const [composeStep, setComposeStep] = useState(0);
  const [composePurpose, setComposePurpose] = useState<'newsletter' | 'portfolio'>('newsletter');
  const [composeText, setComposeText] = useState(
    'Hi {{first_name}},\n\nQuick update for you.\n\nUnsubscribe: {{unsubscribe_url}}\n'
  );

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const hay = [
        c.email,
        c.firstName || '',
        c.lastName || '',
        c.company || '',
        (c.tags || []).join(' '),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, contactSearch]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setError('Unauthorized');
      setLoading(false);
      return;
    }

    try {
      const [contactsRes, campaignsRes] = await Promise.all([
        fetch('/api/marketing/contacts?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/marketing/campaigns?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const cBody = await contactsRes.json().catch(() => ({}));
      const kBody = await campaignsRes.json().catch(() => ({}));

      if (!contactsRes.ok) throw new Error(cBody.error || 'Failed to load contacts');
      if (!campaignsRes.ok) throw new Error(kBody.error || 'Failed to load campaigns');

      setContacts(Array.isArray(cBody.contacts) ? cBody.contacts.map(mapContact) : []);
      setCampaigns(Array.isArray(kBody.campaigns) ? kBody.campaigns.map(mapCampaign) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (composePurpose === 'newsletter') {
      if (!composeName.trim()) setComposeName('Weekly update');
      if (!composeSubject.trim()) setComposeSubject('Weekly update from GetSoloDesk');
      if (!composeText.trim()) {
        setComposeText('Hi {{first_name}},\n\nHere is your weekly update.\n\nUnsubscribe: {{unsubscribe_url}}\n');
      }
      return;
    }
    if (!composeName.trim()) setComposeName('Portfolio spotlight');
    if (!composeSubject.trim()) setComposeSubject('New project highlights');
    if (!composeText.trim()) {
      setComposeText('Hi {{first_name}},\n\nSharing a few fresh portfolio updates.\n\nUnsubscribe: {{unsubscribe_url}}\n');
    }
  }, [composePurpose]);

  const addContact = async () => {
    const email = prompt('Enter email to add (must be opt-in):')?.trim();
    if (!email) return;
    setBusy(true);
    setError(null);
    const token = await getToken();
    try {
      const res = await fetch('/api/marketing/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, status: 'subscribed' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to add contact');
      setContacts((prev) => [mapContact(body.contact), ...prev]);
      setNotice('Contact added.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add contact');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    setBusy(true);
    setError(null);
    const token = await getToken();
    try {
      const rows = parseCsv(importText);
      if (rows.length === 0) throw new Error('No rows found in CSV');

      const candidates = rows
        .map((r) => ({
          email: (r.email || r['e-mail'] || r['email_address'] || '').trim(),
          firstName: (r.first_name || r.firstname || r.first || '').trim(),
          lastName: (r.last_name || r.lastname || r.last || '').trim(),
          company: (r.company || r.organization || '').trim(),
          tags: (r.tags || '').trim(),
          status: 'subscribed',
        }))
        .filter((c) => c.email && c.email.includes('@'));

      if (candidates.length === 0) throw new Error('No valid emails found. CSV must include an "email" column.');

      // Upsert sequentially for simplicity (keeps API surface minimal).
      for (const c of candidates.slice(0, 500)) {
        // eslint-disable-next-line no-await-in-loop
        await fetch('/api/marketing/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(c),
        });
      }

      setImportOpen(false);
      setImportText('');
      await loadAll();
      setNotice(`Imported ${Math.min(500, candidates.length)} contacts.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const createCampaign = async () => {
    setBusy(true);
    setError(null);
    const token = await getToken();
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: composeName,
          subject: composeSubject,
          fromName: composeFromName,
          fromEmail: composeFromEmail,
          replyTo: composeReplyTo || null,
          audienceTag: composeAudienceTag || null,
          bodyText: composeText,
          bodyHtml: '',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to create campaign');
      setCampaigns((prev) => [mapCampaign(body.campaign), ...prev]);
      setNotice('Campaign created.');
      setTab('campaigns');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setBusy(false);
    }
  };

  const sendCampaign = async (campaign: MarketingCampaign) => {
    if (!confirm('Send this campaign to subscribed contacts?')) return;
    setBusy(true);
    setError(null);
    const token = await getToken();
    try {
      const res = await fetch('/api/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaignId: campaign.id,
          tag: campaign.audienceTag || null,
          maxToSend: 500,
          batchSize: 20,
          delayMs: 150,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Send failed');
      setNotice(`Sent: ${body.sent}, Failed: ${body.failed}, Skipped: ${body.skipped}`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hd-app-container space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Email Marketing</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage opt-in contacts and send campaigns with unsubscribe support.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('contacts')}
            className={`px-3 py-2 rounded-xl text-sm font-bold border ${
              tab === 'contacts'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white/70 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Users size={16} /> Contacts
          </button>
          <button
            onClick={() => setTab('campaigns')}
            className={`px-3 py-2 rounded-xl text-sm font-bold border ${
              tab === 'campaigns'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white/70 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Mail size={16} /> Campaigns
          </button>
          <button
            onClick={() => setTab('compose')}
            className={`px-3 py-2 rounded-xl text-sm font-bold border ${
              tab === 'compose'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white/70 dark:bg-slate-900/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Plus size={16} /> Compose
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 p-6 flex items-center gap-3">
          <Loader2 className="animate-spin" size={18} />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading marketing…</div>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/70 dark:bg-emerald-900/10 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/10 p-4 text-sm font-semibold text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {tab === 'contacts' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Search size={16} className="text-slate-400" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts…"
                className="w-full md:w-80 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button disabled={busy} onClick={() => setImportOpen(true)} className="hd-btn-primary px-4 py-2 disabled:opacity-60">
                <Upload size={16} /> Import CSV
              </button>
              <button disabled={busy} onClick={addContact} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm font-bold disabled:opacity-60">
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Email</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Name</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Company</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Tags</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No contacts yet. Import CSV or add manually.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{c.email}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {[c.firstName, c.lastName].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.company || '-'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {(c.tags || []).slice(0, 3).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            c.status === 'subscribed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                              : c.status === 'unsubscribed'
                                ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'campaigns' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">Campaigns</div>
            <button onClick={() => setTab('compose')} className="hd-btn-primary px-4 py-2">
              <Plus size={16} /> New campaign
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {campaigns.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No campaigns yet.</div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {c.name || c.subject}
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">
                        {c.status}
                      </span>
                      {c.audienceTag ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200">
                          tag:{c.audienceTag}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Subject: {c.subject}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busy}
                      onClick={() => void sendCampaign(c)}
                      className="hd-btn-primary px-4 py-2 disabled:opacity-60"
                    >
                      <Send size={16} /> Send
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {tab === 'compose' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl p-5">
          <div className="px-1 pb-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap">
            {['Purpose', 'Content', 'Audience', 'Review'].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <span className={idx === composeStep ? 'text-slate-900 dark:text-white' : ''}>{step}</span>
                {idx < arr.length - 1 ? <span className="text-slate-300 dark:text-slate-700">-</span> : null}
              </React.Fragment>
            ))}
          </div>

          {composeStep === 0 ? (
            <div className="pt-4 space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">What type of campaign do you want?</h3>
              <button
                type="button"
                onClick={() => setComposePurpose('newsletter')}
                className={`w-full text-left rounded-xl border px-4 py-4 transition-colors ${
                  composePurpose === 'newsletter'
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">Newsletter update</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Regular updates, tips, and announcements.</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${composePurpose === 'newsletter' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                    {composePurpose === 'newsletter' ? <Send size={12} /> : null}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setComposePurpose('portfolio')}
                className={`w-full text-left rounded-xl border px-4 py-4 transition-colors ${
                  composePurpose === 'portfolio'
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-900/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">Portfolio spotlight</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share new projects, case studies, and wins.</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${composePurpose === 'portfolio' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                    {composePurpose === 'portfolio' ? <Send size={12} /> : null}
                  </div>
                </div>
              </button>
            </div>
          ) : null}

          {composeStep === 1 ? (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Campaign name</label>
                <input value={composeName} onChange={(e) => setComposeName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Subject</label>
                <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Body (text)</label>
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm font-mono"
                />
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Link2 size={14} /> Tokens: {'{{first_name}}'}, {'{{last_name}}'}, {'{{company}}'}, {'{{unsubscribe_url}}'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {composeStep === 2 ? (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">From name</label>
                <input value={composeFromName} onChange={(e) => setComposeFromName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">From email</label>
                <input value={composeFromEmail} onChange={(e) => setComposeFromEmail(e.target.value)} placeholder="onboarding@yourdomain.com" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Reply-To (optional)</label>
                <input value={composeReplyTo} onChange={(e) => setComposeReplyTo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Audience tag (optional)</label>
                <input value={composeAudienceTag} onChange={(e) => setComposeAudienceTag(e.target.value)} placeholder="example: leads" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm" />
              </div>
            </div>
          ) : null}

          {composeStep === 3 ? (
            <div className="pt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{composeName || '(Untitled campaign)'}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Subject: {composeSubject || '-'}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">From: {composeFromName || '-'} &lt;{composeFromEmail || '-'}&gt;</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Audience: {composeAudienceTag || 'All subscribed contacts'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Preview text</div>
                <pre className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-mono">{composeText}</pre>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              disabled={busy || composeStep === 0}
              onClick={() => setComposeStep((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              Back
            </button>
            {composeStep < 3 ? (
              <button
                disabled={busy}
                onClick={() => setComposeStep((prev) => Math.min(3, prev + 1))}
                className="hd-btn-primary px-5 py-2.5 disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button disabled={busy} onClick={createCampaign} className="hd-btn-primary px-5 py-2.5 disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {busy ? 'Saving...' : 'Save campaign'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {importOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setImportOpen(false)} />
          <div className="absolute inset-x-4 top-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[920px]">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">Import contacts (CSV)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    CSV must include an <span className="font-bold">email</span> column. Only import opt-in contacts.
                  </p>
                </div>
                <button onClick={() => setImportOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={10}
                  placeholder={'email,first_name,last_name,company,tags\nalex@example.com,Alex,Smith,Acme,"lead,newsletter"'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/30 text-slate-900 dark:text-white text-sm font-mono"
                />
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setImportOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200">
                    Cancel
                  </button>
                  <button disabled={busy} onClick={() => void importCsv()} className="hd-btn-primary px-5 py-2.5 disabled:opacity-60">
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {busy ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};


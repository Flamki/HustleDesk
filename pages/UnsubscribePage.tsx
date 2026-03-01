import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import SEO from '../components/SEO';

export const UnsubscribePage: React.FC = () => {
  const [sp] = useSearchParams();
  const token = (sp.get('token') || '').trim();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing token.');
    } else {
      setStatus('idle');
      setMessage('Click confirm to unsubscribe.');
    }
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/public/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Unsubscribe failed');
      setStatus('success');
      setMessage('You have been unsubscribed.');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Unsubscribe failed');
    }
  };

  return (
    <>
      <SEO
        title="Unsubscribe"
        description="Manage your GetSoloDesk marketing email preferences."
        path="/unsubscribe"
        noindex
      />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-transparent p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 backdrop-blur-xl p-6">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Email Preferences</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This link updates your subscription status for marketing emails.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/20 p-4 flex items-center gap-3">
            {status === 'loading' ? (
              <Loader2 className="animate-spin text-slate-500" size={18} />
            ) : status === 'success' ? (
              <CheckCircle2 className="text-emerald-600" size={18} />
            ) : (
              <XCircle className="text-red-600" size={18} />
            )}
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {status === 'loading' ? 'Updating...' : message}
            </div>
          </div>

          {status !== 'success' && token ? (
            <button
              onClick={() => void handleUnsubscribe()}
              disabled={status === 'loading'}
              className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
            >
              {status === 'loading' ? 'Updating...' : 'Confirm Unsubscribe'}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Clock, DollarSign, Sparkles, Users } from 'lucide-react';
import { ClientsInsightsResponse } from '../types';
import { getClientsInsights, updateClientSegmentationWeights } from '../services/supabaseService';

const statusClasses: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  Lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  Dormant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
};

export const ClientsPage: React.FC = () => {
  const [data, setData] = useState<ClientsInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingWeights, setSavingWeights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<ClientsInsightsResponse['segmentation_weights'] | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: result, error: fetchError } = await getClientsInsights();
      if (!active) return;
      if (fetchError || !result) {
        setData(null);
        setError(fetchError?.message || 'Failed to load clients insights');
      } else {
        setData(result);
        setWeights(result.segmentation_weights);
      }
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const summary = data?.summary ?? {
    total_clients: 0,
    retention_rate: 0,
    total_client_revenue: 0,
  };
  const clients = data?.clients ?? [];
  const opportunities = data?.opportunities ?? [];
  const distribution = data?.distribution ?? [];

  const maxDistribution = useMemo(
    () => Math.max(1, ...(distribution.map((d) => d.value) || [1])),
    [distribution]
  );

  const saveWeights = async () => {
    if (!weights) return;
    setSavingWeights(true);
    const { error: saveError } = await updateClientSegmentationWeights(weights);
    setSavingWeights(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const { data: refreshed } = await getClientsInsights();
    if (refreshed) setData(refreshed);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Client Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Relationship analytics from your pipeline and tracked delivery effort.
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat title="Total Clients" value={data ? String(summary.total_clients) : '-'} icon={<Users size={18} />} />
        <Stat title="Retention Rate" value={data ? `${summary.retention_rate.toFixed(1)}%` : '-'} icon={<Briefcase size={18} />} />
        <Stat title="Client Revenue" value={data ? `$${summary.total_client_revenue.toFixed(2)}` : '-'} icon={<DollarSign size={18} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Client Portfolio</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-500">Client</th>
                  <th className="text-left px-4 py-3 text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-slate-500">Projects</th>
                  <th className="text-left px-4 py-3 text-slate-500">Hours</th>
                  <th className="text-left px-4 py-3 text-slate-500">Revenue</th>
                  <th className="text-left px-4 py-3 text-slate-500">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Loading clients...
                    </td>
                  </tr>
                ) : !data || clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No client data found.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Last active {c.last_active_label}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${statusClasses[c.status] || statusClasses.Lead}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.projects_count}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.tracked_hours.toFixed(2)}h</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">${c.total_revenue.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${c.health_score}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{c.health_score}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl border border-slate-800 p-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles size={16} /> Smart Opportunities
            </h3>
            {loading ? (
              <p className="text-sm text-slate-300 mt-4">Analyzing opportunities...</p>
            ) : !data || opportunities.length === 0 ? (
              <p className="text-sm text-slate-300 mt-4">No high-signal opportunities right now.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {opportunities.map((o, idx) => (
                  <div key={`${o.client}-${idx}`} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-sm font-semibold">{o.client}</p>
                    <p className="text-xs text-slate-300 mt-1">{o.reason}</p>
                    <p className="text-xs text-indigo-200 mt-2">Potential ${o.potential}</p>
                    <p className="text-xs text-emerald-300 mt-1">{o.action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} /> Status Distribution
            </h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading distribution...</p>
            ) : !data || distribution.length === 0 ? (
              <p className="text-sm text-slate-500">No data.</p>
            ) : (
              <div className="space-y-3">
                {distribution.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{d.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{d.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(d.value / maxDistribution) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Segmentation Weights</h3>
            {!weights ? (
              <p className="text-sm text-slate-500">Loading settings...</p>
            ) : (
              <div className="space-y-3">
                <WeightInput label="Won job weight" value={weights.won_job_weight} onChange={(v) => setWeights((p) => (p ? { ...p, won_job_weight: v } : p))} />
                <WeightInput label="Active lead weight" value={weights.active_lead_weight} onChange={(v) => setWeights((p) => (p ? { ...p, active_lead_weight: v } : p))} />
                <WeightInput label="Revenue weight" value={weights.revenue_weight} onChange={(v) => setWeights((p) => (p ? { ...p, revenue_weight: v } : p))} />
                <WeightInput label="Recent recency weight" value={weights.recency_recent_weight} onChange={(v) => setWeights((p) => (p ? { ...p, recency_recent_weight: v } : p))} />
                <WeightInput label="Warm recency weight" value={weights.recency_warm_weight} onChange={(v) => setWeights((p) => (p ? { ...p, recency_warm_weight: v } : p))} />
                <WeightInput label="Dormancy penalty" value={weights.dormancy_penalty} onChange={(v) => setWeights((p) => (p ? { ...p, dormancy_penalty: v } : p))} />
                <button
                  onClick={() => {
                    void saveWeights();
                  }}
                  disabled={savingWeights}
                  className="w-full mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60"
                >
                  {savingWeights ? 'Saving...' : 'Save Weights'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-xs uppercase tracking-wide text-slate-500 mt-3">{title}</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

const WeightInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-xs text-slate-500">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
    />
  </label>
);

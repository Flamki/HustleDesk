import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
  X,
} from 'lucide-react';
import { ClientsInsightsResponse } from '../types';
import { getClientsInsights, updateClientSegmentationWeights } from '../services/supabaseService';
import { EmptyState, LoadingSpinner, Alert, useToast } from '../components/ui';
import { Link } from 'react-router-dom';

const statusClasses: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  Lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  Dormant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
};

const healthColor = (score: number) => {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const healthLabel = (score: number) => {
  if (score >= 70) return { text: 'Strong', cls: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 40) return { text: 'Warm', cls: 'text-amber-600 dark:text-amber-400' };
  return { text: 'At Risk', cls: 'text-red-600 dark:text-red-400' };
};

type ClientRow = ClientsInsightsResponse['clients'][number];

export const ClientsPage: React.FC = () => {
  const [data, setData] = useState<ClientsInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Lead' | 'Dormant'>('All');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [sortBy, setSortBy] = useState<'revenue' | 'health' | 'recent' | 'projects'>('revenue');
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: result, error: fetchError } = await getClientsInsights();
      if (!active) return;
      if (fetchError || !result) {
        setData(null);
        setError(fetchError?.message || 'Failed to load clients');
      } else {
        setData(result);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const summary = data?.summary ?? { total_clients: 0, retention_rate: 0, total_client_revenue: 0 };
  const clients = data?.clients ?? [];
  const opportunities = data?.opportunities ?? [];

  const filteredClients = useMemo(() => {
    let list = [...clients];
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'revenue': list.sort((a, b) => b.total_revenue - a.total_revenue); break;
      case 'health': list.sort((a, b) => b.health_score - a.health_score); break;
      case 'projects': list.sort((a, b) => b.projects_count - a.projects_count); break;
      case 'recent': break; // keep API order (already by recency)
    }
    return list;
  }, [clients, statusFilter, searchQuery, sortBy]);

  const activeCount = clients.filter((c) => c.status === 'Active').length;
  const avgHealth = clients.length ? Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length) : 0;
  const topClient = clients.length ? [...clients].sort((a, b) => b.total_revenue - a.total_revenue)[0] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track relationships, spot upsell opportunities, and never lose a client.
          </p>
        </div>
        <Link to="/app/jobs/new" className="hd-btn-primary px-5 py-2.5 flex items-center gap-2 w-fit">
          <Plus size={18} /> New Job
        </Link>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Row — unique metrics not on Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={data ? String(summary.total_clients) : '-'} icon={<Users size={18} />}
          sub={activeCount ? `${activeCount} active` : undefined} />
        <StatCard title="Retention Rate" value={data ? `${summary.retention_rate.toFixed(0)}%` : '-'} icon={<TrendingUp size={18} />}
          sub={summary.retention_rate >= 70 ? 'Healthy' : 'Needs attention'} color={summary.retention_rate >= 70 ? 'emerald' : 'amber'} />
        <StatCard title="Avg Health Score" value={data ? String(avgHealth) : '-'} icon={<Sparkles size={18} />}
          sub={healthLabel(avgHealth).text} color={avgHealth >= 70 ? 'emerald' : avgHealth >= 40 ? 'amber' : 'red'} />
        <StatCard title="Top Client" value={topClient?.name || '-'} icon={<DollarSign size={18} />}
          sub={topClient ? `$${topClient.total_revenue.toFixed(0)} revenue` : undefined} small />
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Lead', 'Dormant'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === s
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none">
          <option value="revenue">Sort: Revenue</option>
          <option value="health">Sort: Health</option>
          <option value="projects">Sort: Projects</option>
          <option value="recent">Sort: Recent</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Client Cards */}
        <div className="xl:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10">
              <LoadingSpinner text="Loading clients..." />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <EmptyState
                icon={Users}
                title={searchQuery || statusFilter !== 'All' ? 'No clients match' : 'No clients yet'}
                description={searchQuery || statusFilter !== 'All'
                  ? 'Try a different search or filter.'
                  : 'Start winning jobs to build your client relationships.'}
                action={{ label: 'Add New Job', onClick: () => window.location.href = '/app/jobs/new', icon: UserPlus }}
              />
            </div>
          ) : (
            filteredClients.map((c) => {
              const hl = healthLabel(c.health_score);
              const isSelected = selectedClient?.name === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedClient(isSelected ? null : c)}
                  className={`w-full text-left bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 group hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-900/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Last active {c.last_active_label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${statusClasses[c.status] || statusClasses.Lead}`}>
                        {c.status}
                      </span>
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-slate-900 dark:text-white">{c.projects_count}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Jobs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-emerald-600">${c.total_revenue.toFixed(0)}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-slate-900 dark:text-white">{c.tracked_hours.toFixed(1)}h</p>
                          <p className="text-[10px] text-slate-400 uppercase">Hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full ${healthColor(c.health_score)} rounded-full`} style={{ width: `${c.health_score}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${hl.cls}`}>{c.health_score}</span>
                      </div>
                      <ChevronRight size={16} className={`text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:hidden">
                        <MiniStat label="Jobs" value={String(c.projects_count)} />
                        <MiniStat label="Revenue" value={`$${c.total_revenue.toFixed(0)}`} />
                        <MiniStat label="Hours" value={`${c.tracked_hours.toFixed(1)}h`} />
                        <MiniStat label="Health" value={String(c.health_score)} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to="/app/jobs/new" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                          <Plus size={14} /> New Job for {c.name}
                        </Link>
                        <Link to="/app/invoices" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                          <FileText size={14} /> Create Invoice
                        </Link>
                        <Link to="/app/templates" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
                          <MessageSquare size={14} /> Follow-up Template
                        </Link>
                      </div>

                      {/* Per-client insight */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Sparkles size={12} className="inline mr-1" />
                          Client Insight
                        </p>
                        {c.status === 'Active' && c.health_score >= 70 && (
                          <p>Strong relationship! Consider proposing an upsell or retainer agreement. Clients like {c.name} with {c.projects_count} projects are ideal for long-term partnerships.</p>
                        )}
                        {c.status === 'Active' && c.health_score < 70 && (
                          <p>This client is active but health is declining. Send a check-in message to strengthen the relationship before they go dormant.</p>
                        )}
                        {c.status === 'Lead' && (
                          <p>Still in the lead phase. Focus on converting with a strong proposal. Use templates to send a personalized follow-up within 48 hours.</p>
                        )}
                        {c.status === 'Dormant' && (
                          <p>Haven&apos;t heard from this client in a while. Consider sending a re-engagement message or sharing a relevant case study to rekindle the relationship.</p>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar: Opportunities */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl border border-slate-800 p-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles size={16} /> Smart Opportunities
            </h3>
            <p className="text-xs text-slate-400 mt-1">AI-detected upsell and re-engagement signals</p>
            {loading ? (
              <p className="text-sm text-slate-300 mt-4">Analyzing opportunities...</p>
            ) : !data || opportunities.length === 0 ? (
              <p className="text-sm text-slate-300 mt-4">Win more jobs to unlock opportunity detection.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {opportunities.map((o, idx) => (
                  <div key={`${o.client}-${idx}`} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-sm font-semibold">{o.client}</p>
                    <p className="text-xs text-slate-300 mt-1">{o.reason}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-indigo-200">Potential ${o.potential}</p>
                      <p className="text-xs text-emerald-300 font-medium">{o.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Client Relationship Tips</h3>
            <div className="space-y-3">
              {[
                { icon: Mail, text: 'Follow up within 48h of proposal submission' },
                { icon: Clock, text: 'Check in monthly with active clients' },
                { icon: DollarSign, text: 'Propose retainers to clients with 3+ projects' },
                { icon: MessageSquare, text: 'Send a case study to dormant clients' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <tip.icon size={12} className="text-indigo-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  color?: 'emerald' | 'amber' | 'red';
  small?: boolean;
}> = ({ title, value, icon, sub, color = 'emerald', small }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
      {icon}
    </div>
    <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-3 font-semibold">{title}</p>
    <p className={`font-bold text-slate-900 dark:text-white mt-0.5 ${small ? 'text-lg truncate' : 'text-2xl'}`}>{value}</p>
    {sub && (
      <p className={`text-xs font-medium mt-1 ${
        color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
        color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
        'text-red-600 dark:text-red-400'
      }`}>{sub}</p>
    )}
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
    <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-[10px] text-slate-400 uppercase">{label}</p>
  </div>
);

export default ClientsPage;

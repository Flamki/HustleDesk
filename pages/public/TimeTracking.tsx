import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Pause,
  DollarSign,
  PieChart,
  Calendar,
  Share2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const TimeTracking: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const rate = 75; // $/hr
  const cta = `/signup?returnTo=${encodeURIComponent('/app/time?source=time-tracking')}`;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  const earnings = ((seconds / 3600) * rate).toFixed(2);

  return (
    <PublicPageLayout>
      <SEO
        title="Free Time Tracking for Freelancers"
        description="Track billable hours effortlessly. One-click timer, automatic rate calculations, and shareable session reports."
        path="/time-tracking"
        keywords={['time tracking for freelancers', 'free time tracker', 'billable hours tracker']}
      />

      {/* ═══ HERO — Live interactive timer ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Time Tracker</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Every untracked<br />minute is{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  lost money.
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Freelancers who track time bill 20% more. GetSoloDesk's timer is built into your CRM — every minute connects to a client, project, and invoice.
              </p>
              <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all group">
                Start Tracking Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Right — LIVE interactive timer */}
            <div className="relative">
              <div className="bg-slate-900 rounded-2xl p-8 text-center shadow-2xl shadow-blue-500/10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Acme Corp — Website Redesign</p>
                <p className="text-6xl md:text-7xl font-mono font-bold text-white tracking-wider mb-4">{fmt(seconds)}</p>
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div>
                    <p className="text-xs text-slate-500">Rate</p>
                    <p className="text-lg font-bold text-slate-300">${rate}/hr</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div>
                    <p className="text-xs text-slate-500">Earned</p>
                    <p className="text-lg font-bold text-emerald-400">${earnings}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setRunning(!running)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      running
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {seconds > 0 ? 'Resume' : 'Start'}</>}
                  </button>
                  {seconds > 0 && (
                    <button
                      onClick={() => { setRunning(false); setSeconds(0); }}
                      className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-600 hover:text-white transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="mt-6 text-[10px] text-slate-600">Try it — this is a real working timer ↑</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE MATH — Revenue impact ═══ */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <p className="text-5xl font-bold">2.5h</p>
              <p className="mt-2 text-blue-100/60 text-sm">Average daily untracked time</p>
            </div>
            <div>
              <p className="text-5xl font-bold">$187</p>
              <p className="mt-2 text-blue-100/60 text-sm">Lost per day at $75/hr</p>
            </div>
            <div>
              <p className="text-5xl font-bold">$4,500</p>
              <p className="mt-2 text-blue-100/60 text-sm">Lost per month</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — Horizontal cards ═══ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-4">
            More than just a timer
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
            Time tracking that connects to your entire freelance business.
          </p>

          <div className="space-y-4">
            {[
              { icon: DollarSign, title: 'Auto Rate Calculations', desc: 'Set your hourly rate, watch earnings update in real-time as you work. Multi-currency support.' },
              { icon: Layers, title: 'Project Organization', desc: 'Tag entries by client, project, and task. Detailed categorization for clean invoicing.' },
              { icon: FileSpreadsheet, title: 'Invoice-Ready Reports', desc: 'Export weekly/monthly summaries formatted for invoicing. No manual spreadsheet work.' },
              { icon: PieChart, title: 'Visual Breakdowns', desc: 'Pie charts and bar graphs showing where your time goes. Find your most profitable work.' },
              { icon: Calendar, title: 'Manual Entries', desc: 'Forgot to start the timer? Add entries manually with date, duration, and project details.' },
              { icon: Share2, title: 'Shareable Sessions', desc: 'Generate share links for completed sessions. Send proof-of-work to clients with one click.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-5 p-5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <f.icon size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-blue-600 to-cyan-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Every minute counts. Start tracking them.
          </h2>
          <p className="text-blue-100/60 mb-8">Free forever. Built into your CRM.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg group">
            Start Tracking <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default TimeTracking;

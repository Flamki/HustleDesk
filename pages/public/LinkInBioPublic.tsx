import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LinkIcon, Palette, Smartphone, Mail, BarChart3, MousePointer2, Instagram, Users } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

const mockLinks = [
  { emoji: '💼', label: 'View My Portfolio', color: '#6366f1' },
  { emoji: '📅', label: 'Book a Discovery Call', color: '#10b981' },
  { emoji: '✉️', label: 'Email Me', color: '#f59e0b' },
  { emoji: '🐦', label: 'Follow on Twitter', color: '#0ea5e9' },
  { emoji: '💻', label: 'GitHub', color: '#1e293b' },
];

export const LinkInBioPublic: React.FC = () => {
  const cta = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=link-in-bio')}`;

  return (
    <PublicPageLayout>
      <SEO
        title="Link-in-Bio Builder for Freelancers"
        description="Create a beautiful link-in-bio page. Custom branding, social links, lead capture — free for freelancers."
        path="/link-in-bio"
        keywords={['link in bio builder', 'free link in bio tool', 'linktree alternative for freelancers']}
      />

      {/* ═══ HERO — Phone mockup with live bio preview ═══ */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 mb-6">
                <LinkIcon size={12} className="text-sky-600" />
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Link in Bio</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                One link.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
                  Infinite reach.
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Turn social followers into paying clients. A conversion-focused bio page with custom branding, lead capture, and click analytics — not just a list of links.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={cta} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all group">
                  Create Your Page <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right — Phone mockup */}
            <div className="flex justify-center">
              <div className="w-[280px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-900/20">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Notch */}
                  <div className="h-8 bg-slate-900 flex items-end justify-center pb-1">
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full" />
                  </div>
                  {/* Bio content */}
                  <div className="px-5 py-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">A</div>
                    <p className="font-bold text-slate-900 text-sm">Alex Chen</p>
                    <p className="text-xs text-slate-500 mt-0.5">Full-Stack Developer • Open to work</p>
                    <div className="flex justify-center gap-3 mt-3">
                      {['🐦', '💻', '📸'].map((e, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">{e}</div>
                      ))}
                    </div>
                    <div className="mt-5 space-y-2.5">
                      {mockLinks.map((l, i) => (
                        <div key={i} className="py-3 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer">
                          <span>{l.emoji}</span>
                          <span>{l.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400">Powered by GetSoloDesk</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON — Why not Linktree ═══ */}
      <section className="bg-slate-50 py-20 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center mb-4">Why freelancers choose this over Linktree</h2>
          <p className="text-slate-500 text-center mb-12 max-w-lg mx-auto">Built for conversions, not just clicks.</p>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-bold text-slate-900">Feature</th>
                  <th className="px-5 py-3 font-bold text-slate-400 text-center">Linktree</th>
                  <th className="px-5 py-3 font-bold text-indigo-600 text-center">GetSoloDesk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Lead capture forms', '❌', '✅'],
                  ['CRM integration', '❌', '✅'],
                  ['Click analytics', '💰 Pro', '✅ Free'],
                  ['Custom branding', '💰 Pro', '✅ Free'],
                  ['Freelancer-focused', '❌', '✅'],
                  ['Connected to proposals & jobs', '❌', '✅'],
                ].map(([f, l, g], i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-700">{f}</td>
                    <td className="px-5 py-3 text-center text-slate-400">{l}</td>
                    <td className="px-5 py-3 text-center font-semibold text-indigo-600">{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — Icon row ═══ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Palette, title: 'Full Branding Control', desc: 'Custom colors, fonts, avatar, and layout. Your page, your brand.' },
              { icon: Mail, title: 'Lead Capture', desc: 'Email collection forms that feed directly into your CRM.' },
              { icon: BarChart3, title: 'Click Analytics', desc: 'See which links convert. Optimize your funnel with data.' },
              { icon: Smartphone, title: 'Mobile-First', desc: 'Thumb-friendly design optimized for Instagram and TikTok.' },
              { icon: MousePointer2, title: 'CTA Buttons', desc: '"Hire Me", "Book a Call" — drive action, not just clicks.' },
              { icon: Users, title: 'CRM Connected', desc: 'Leads flow into your pipeline automatically.' },
            ].map((f, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
                  <f.icon size={20} className="text-sky-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-br from-sky-500 to-indigo-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Your social bio deserves better.</h2>
          <p className="text-sky-100/60 mb-8">Free. Launch in under 5 minutes.</p>
          <Link to={cta} className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg group">
            Create Your Page <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default LinkInBioPublic;

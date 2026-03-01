import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

const links = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/freelancer-crm', label: 'Freelancer CRM' },
  { href: '/proposal-generator', label: 'Proposal Generator' },
  { href: '/time-tracking', label: 'Time Tracking' },
  { href: '/client-portal', label: 'Client Portal' },
  { href: '/portfolio-builder', label: 'Portfolio Builder' },
  { href: '/link-in-bio', label: 'Link in Bio' },
];

export const PublicPageLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-lg tracking-tight">GetSoloDesk</Link>
          <nav className="hidden lg:flex items-center gap-5 text-sm text-slate-600">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="hover:text-slate-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-2 text-sm border rounded-lg border-slate-300 hover:bg-slate-50">Login</Link>
            <Link to="/signup" className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700">Start Free</Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">
          <div className="font-semibold text-slate-800">GetSoloDesk</div>
          <p className="mt-1">Freelancer CRM, proposals, time tracking, and client growth tools.</p>
        </div>
      </footer>
    </div>
  );
};



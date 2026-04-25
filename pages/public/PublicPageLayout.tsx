import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Clock,
  Users,
  Briefcase,
  LinkIcon,
  Sparkles,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';

type Props = {
  children: React.ReactNode;
};

const productPages = [
  { href: '/freelancer-crm', label: 'Freelancer CRM', desc: 'Track leads, clients & deals', icon: LayoutDashboard },
  { href: '/proposal-generator', label: 'AI Proposals', desc: 'Win more with AI-written proposals', icon: FileText },
  { href: '/time-tracking', label: 'Time Tracking', desc: 'Log hours & bill accurately', icon: Clock },
  { href: '/client-portal', label: 'Client Portal', desc: 'Share project updates with clients', icon: Users },
  { href: '/portfolio-builder', label: 'Portfolio Builder', desc: 'Showcase your best work', icon: Briefcase },
  { href: '/link-in-bio', label: 'Link in Bio', desc: 'One link for all your profiles', icon: LinkIcon },
];

export const PublicPageLayout: React.FC<Props> = ({ children }) => {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProductsOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setProductsOpen(false), 150);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <BrandLogo className="h-7 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors font-medium">Home</Link>
            <Link to="/features" className="hover:text-slate-900 transition-colors font-medium">Features</Link>
            <Link to="/pricing" className="hover:text-slate-900 transition-colors font-medium">Pricing</Link>

            {/* Products Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="flex items-center gap-1 font-medium hover:text-slate-900 transition-colors"
              >
                Products
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Panel */}
              {productsOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <div className="w-[400px] bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-5 pt-4 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Products</p>
                    </div>

                    {/* Links */}
                    <div className="px-2 pb-2">
                      {productPages.map((page) => (
                        <Link
                          key={page.href}
                          to={page.href}
                          onClick={() => setProductsOpen(false)}
                          className="flex items-start gap-3.5 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="min-w-[36px] h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <page.icon size={16} className="text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {page.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {page.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                      <Link
                        to="/features"
                        onClick={() => setProductsOpen(false)}
                        className="flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} />
                          View all features
                        </div>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/login" className="hidden lg:block px-3 py-2 text-sm border rounded-lg border-slate-300 hover:bg-slate-50 font-medium">Login</Link>
            <Link to="/signup" className="hidden lg:block px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700 font-medium">Start Free</Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col py-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-slate-700 hover:text-slate-900">Home</Link>
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-slate-700 hover:text-slate-900">Features</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-slate-700 hover:text-slate-900">Pricing</Link>

              {/* Products Accordion */}
              <button
                onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                className="py-3 text-base font-medium text-slate-700 hover:text-slate-900 flex items-center justify-between w-full"
              >
                Products
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${mobileProductsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileProductsOpen && (
                <div className="pl-4 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {productPages.map((page) => (
                    <Link
                      key={page.href}
                      to={page.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <page.icon size={14} className="text-indigo-400" />
                      <span className="text-sm font-medium">{page.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              <hr className="border-slate-200 my-2" />
              <div className="flex items-center gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-3 py-2.5 text-sm border rounded-lg border-slate-300 hover:bg-slate-50 font-medium">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-3 py-2.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700 font-medium">Start Free</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">
          <div className="flex items-center">
            <BrandLogo className="h-7 w-auto" />
          </div>
          <p className="mt-1">Freelancer CRM, proposals, time tracking, and client growth tools.</p>
        </div>
      </footer>
    </div>
  );
};

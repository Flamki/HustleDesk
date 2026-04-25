
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Clock,
  Users,
  Briefcase,
  LinkIcon,
  Sparkles,
  Receipt,
  FileSignature,
  BookOpen,
  Mail,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../brand/BrandLogo';

const productPages = [
  { href: '/freelancer-crm', label: 'Freelancer CRM', desc: 'Track leads, clients & deals', icon: LayoutDashboard },
  { href: '/proposal-generator', label: 'AI Proposals', desc: 'Win more with AI-written proposals', icon: FileText },
  { href: '/time-tracking', label: 'Time Tracking', desc: 'Log hours & bill accurately', icon: Clock },
  { href: '/invoice-generator', label: 'Invoicing', desc: 'Send invoices, get paid via Stripe', icon: Receipt },
  { href: '/contract-builder', label: 'Contracts', desc: 'AI-generated freelance contracts', icon: FileSignature },
  { href: '/client-portal', label: 'Client Portal', desc: 'Share project updates with clients', icon: Users },
  { href: '/portfolio-builder', label: 'Portfolio Builder', desc: 'Showcase your best work', icon: Briefcase },
  { href: '/link-in-bio', label: 'Link in Bio', desc: 'One link for all your profiles', icon: LinkIcon },
  { href: '/templates', label: 'Templates', desc: '36+ proven freelance templates', icon: BookOpen },
  { href: '/email-marketing', label: 'Email Marketing', desc: 'Nurture leads on autopilot', icon: Mail },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Close dropdown on route change
  useEffect(() => {
    setProductsOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProductsOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setProductsOpen(false), 150);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
      { label: 'Features', id: 'features' },
      { label: 'Pricing', id: 'pricing' },
      { label: 'FAQ', id: 'faq' },
  ];
  const startFreePath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_nav')}`;
  const proCheckoutPath = `/login?returnTo=${encodeURIComponent('/app/settings?tab=billing&action=checkout&source=landing_nav')}`;

  return (
    <>
        <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center ${
            isScrolled ? 'pt-4' : 'pt-6'
        }`}
        >
        <div 
            className={`
                relative flex items-center justify-between px-6 transition-all duration-500
                ${isScrolled 
                    ? 'w-[90%] md:w-[70%] lg:w-[60%] bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl py-3' 
                    : 'w-full max-w-7xl bg-transparent py-4'
                }
            `}
        >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <BrandLogo
                    className="h-8 w-auto"
                    tone={isScrolled || theme === 'dark' ? 'inverse' : 'default'}
                />
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                    <a 
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => scrollToSection(e, item.id)}
                        className={`text-sm font-medium transition-colors hover:text-indigo-400 ${isScrolled ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        {item.label}
                    </a>
                ))}
                <Link
                  to="/blog"
                  className={`text-sm font-medium transition-colors hover:text-indigo-400 ${isScrolled ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Blog
                </Link>

                {/* Products Dropdown */}
                <div
                  ref={dropdownRef}
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    onClick={() => setProductsOpen(!productsOpen)}
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 flex items-center gap-1 ${isScrolled ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
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
                      <div className="w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="px-5 pt-4 pb-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Products</p>
                        </div>

                        {/* Links Grid */}
                        <div className="px-2 pb-2">
                          {productPages.map((page) => (
                            <Link
                              key={page.href}
                              to={page.href}
                              className="flex items-start gap-3.5 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                              <div className="min-w-[36px] h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                <page.icon size={16} className="text-indigo-500 dark:text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {page.label}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                  {page.desc}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* Footer CTA */}
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                          <Link
                            to="/features"
                            className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
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
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-colors ${isScrolled ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <div className={`h-4 w-px ${isScrolled ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <Link to="/login" className={`text-sm font-medium hover:text-indigo-500 transition-colors ${isScrolled ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    Log in
                </Link>
                <Link
                    to={startFreePath}
                    className="pl-4 pr-1 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-500 transition-all flex items-center gap-2"
                >
                    Start Free
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white">
                        <ArrowRight size={12} />
                    </div>
                </Link>
            </div>

            {/* Mobile Toggle */}
            <button 
                className={`md:hidden p-2 ${isScrolled ? 'text-white' : 'text-slate-900 dark:text-white'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-slate-900 pt-24 px-6 animate-in slide-in-from-top-10 overflow-y-auto pb-12">
                <div className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <a 
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => scrollToSection(e, item.id)}
                            className="text-xl font-medium text-slate-300 hover:text-white py-2"
                        >
                            {item.label}
                        </a>
                    ))}

                    <Link
                      to="/blog"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-medium text-slate-300 hover:text-white py-2"
                    >
                      Blog
                    </Link>

                    {/* Mobile Products Accordion */}
                    <button
                      onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                      className="text-xl font-medium text-slate-300 hover:text-white py-2 flex items-center justify-between"
                    >
                      Products
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${mobileProductsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {mobileProductsOpen && (
                      <div className="pl-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {productPages.map((page) => (
                          <Link
                            key={page.href}
                            to={page.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-slate-400 hover:text-white transition-colors"
                          >
                            <page.icon size={16} className="text-indigo-400" />
                            <span className="text-base font-medium">{page.label}</span>
                          </Link>
                        ))}
                        <Link
                          to="/features"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 py-3 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Sparkles size={16} />
                          <span className="text-base font-semibold">All Features</span>
                        </Link>
                      </div>
                    )}

                    <hr className="border-slate-800 my-2" />
                    <Link to="/login" className="text-xl font-medium text-white py-2">Log in</Link>
                    <Link to={startFreePath} className="text-xl font-bold text-white bg-indigo-600 rounded-xl py-3 px-5 text-center">Start Free</Link>
                    <Link to={proCheckoutPath} className="text-xl font-bold text-emerald-300 text-center py-2">Upgrade to Pro</Link>
                </div>
            </div>
        )}
    </>
  );
};

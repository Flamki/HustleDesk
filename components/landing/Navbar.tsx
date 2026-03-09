
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../brand/BrandLogo';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      { label: 'Comparison', id: 'why' },
      { label: 'Pricing', id: 'pricing' },
      { label: 'FAQ', id: 'faq' },
  ];

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
            <div className="hidden md:flex items-center gap-8">
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
                    to="/signup"
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
            <div className="fixed inset-0 z-40 bg-slate-900 pt-24 px-6 animate-in slide-in-from-top-10">
                <div className="flex flex-col gap-6 text-center">
                    {navItems.map((item) => (
                        <a 
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => scrollToSection(e, item.id)}
                            className="text-xl font-medium text-slate-300 hover:text-white"
                        >
                            {item.label}
                        </a>
                    ))}
                    <hr className="border-slate-800" />
                    <Link to="/login" className="text-xl font-medium text-white">Log in</Link>
                    <Link to="/signup" className="text-xl font-bold text-white bg-indigo-600 rounded-xl py-2.5 px-5">Start Free</Link>
                </div>
            </div>
        )}
    </>
  );
};


import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Plus, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { BrandLogo } from '../brand/BrandLogo';

export const AppNavbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getAvatarUrl = () => {
    const seed = user?.email || 'default';
    const gender = profile?.preferences?.profileSetup?.gender || 'female';
    
    // Explicitly lock 'top' features to standard hair options to completely avoid any hats or religious symbols.
    const maleTops = ['shortHairDreads01','shortHairDreads02','shortHairFrizzle','shortHairShaggyMullet','shortHairShortCurly','shortHairShortFlat','shortHairShortRound','shortHairShortWaved','shortHairSides','shortHairTheCaesar','shortHairTheCaesarAndSidePart'];
    const femaleTops = ['longHairBigHair','longHairBob','longHairBun','longHairCurly','longHairCurvy','longHairDreads','longHairFrida','longHairFro','longHairFroBand','longHairNotTooLong','longHairShavedSides','longHairMiaWallace','longHairStraight','longHairStraight2','longHairStraightStrand'];
    const nbTops = [...maleTops, ...femaleTops];
    
    let tops = femaleTops;
    let seedPrefix = 'f-';
    
    if (gender === 'male') {
      tops = maleTops;
      seedPrefix = 'm-';
    } else if (gender === 'non_binary') {
      tops = nbTops;
      seedPrefix = 'nb-';
    }

    const topsQuery = `top=${tops.join(',')}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedPrefix}${seed}&${topsQuery}`;
  };

  const isActive = (path: string) => {
     return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavLink = ({ to, icon: Icon, label, onClick }: any) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
            ${isActive(to) 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }
        `}
    >
        <Icon size={18} />
        {label}
    </Link>
  );

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors duration-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
            <Link to="/app" className="flex items-center gap-2 group">
                <BrandLogo className="h-7 w-auto" tone={theme === 'dark' ? 'inverse' : 'default'} />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
                <NavLink to="/app/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/app/jobs" icon={Briefcase} label="Jobs" />
            </div>
        </div>

        <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Dark Mode"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Desktop Add Job */}
            <Link 
                to="/app/jobs/new"
                className="hidden sm:flex bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
            >
                <Plus size={16} />
                Add Job
            </Link>

            {/* User Avatar */}
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-600 shadow-sm overflow-hidden hidden sm:block">
                <img loading="lazy" decoding="async" src={getAvatarUrl()} alt="Avatar" className="w-full h-full" />
            </div>

            {/* Mobile Menu Button */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 text-slate-500 dark:text-slate-400"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 z-50 max-h-[90vh] overflow-y-auto">
            <div className="space-y-2">
                <NavLink to="/app/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
                <NavLink to="/app/jobs" icon={Briefcase} label="Jobs" onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <Link 
                    to="/app/jobs/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full justify-center bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-medium items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    Add New Job
                </Link>
            </div>
             <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <img loading="lazy" decoding="async" src={getAvatarUrl()} alt="Avatar" className="w-full h-full" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'Welcome'}</p>
                </div>
            </div>
        </div>
      )}
    </nav>
  );
};


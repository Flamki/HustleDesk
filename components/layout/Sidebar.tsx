
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Plus, 
  LogOut, 
  Sun, 
  Moon,
  FileText,
  BarChart2,
  Settings,
  HelpCircle,
  Users,
  Mail,
  UserCircle,
  ArrowLeft,
  Shield,
  CreditCard,
  Bell,
  Sparkles,
  Trash2,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Gift,
  MoreVertical,
  Timer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo, BrandMark } from '../brand/BrandLogo';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose, isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [websiteOpen, setWebsiteOpen] = useState(false);
  const [websiteMenuPos, setWebsiteMenuPos] = useState<{ top: number; left: number } | null>(null);
  const websiteButtonRef = useRef<HTMLButtonElement | null>(null);
  const websiteMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!websiteOpen) return;

    const closeMenu = () => setWebsiteOpen(false);
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (websiteMenuRef.current?.contains(target)) return;
      if (websiteButtonRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWebsiteOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [websiteOpen]);

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await signOut();
    onClose?.();
    navigate('/login', { replace: true });
  };

  const handleProfileNav = (to: string) => {
    setProfileMenuOpen(false);
    onClose?.();
    navigate(to);
  };

  // Check context
  const isSettings = location.pathname.startsWith('/app/settings');
  const activeTab = searchParams.get('tab') || 'profile';

  const isActive = (path: string, exact = true) => {
     if (isSettings) {
         // In settings mode, check query param
         return activeTab === path; // path passed as tab id
     }
     // In workspace mode, check pathname
     if (exact) return location.pathname === path;
     if (path === '/app/jobs' && location.pathname === '/app/jobs/new') return false; 
     return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const NavItem = ({ to, icon: Icon, label, exact = true, badge }: any) => {
    const active = isActive(to, exact);
    return (
      <Link
        to={to}
        onClick={onClose}
        title={isCollapsed ? label : undefined}
        aria-label={isCollapsed ? label : undefined}
        className={`
          relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group
          ${isCollapsed ? 'p-2.5' : 'px-3 py-2.5'}
          ${active
            ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        {/* Active Indicator Bar */}
        {active && !isCollapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
        )}

        <div className={`relative flex items-center justify-center transition-colors ${active ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {badge && isCollapsed && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            )}
        </div>
        
        {!isCollapsed && (
            <div className="flex-1 flex justify-between items-center ml-1">
                <span>{label}</span>
                {badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        {badge}
                    </span>
                )}
            </div>
        )}
      </Link>
    );
  };

  const SettingsNavItem = ({ tab, icon: Icon, label }: any) => {
    const active = activeTab === tab;
    return (
      <Link
        to={`/app/settings?tab=${tab}`}
        onClick={onClose}
        title={isCollapsed ? label : undefined}
        aria-label={isCollapsed ? label : undefined}
        className={`
          relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group
          ${isCollapsed ? 'p-2.5' : 'px-3 py-2.5'}
          ${active
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <div className={`transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </div>
        
        {!isCollapsed && <span className="ml-1">{label}</span>}
      </Link>
    );
  };

  const WebsiteGroup = () => {
    const isWebsiteRoute = location.pathname.startsWith('/app/marketing/website');
    const toggleWebsiteMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (websiteOpen) {
        setWebsiteOpen(false);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 92;
      const viewportPadding = 12;
      const top = Math.max(viewportPadding, Math.min(window.innerHeight - menuHeight - viewportPadding, rect.bottom - menuHeight));
      const left = rect.right + 8;
      setWebsiteMenuPos({ top, left });
      setWebsiteOpen(true);
    };

    if (isCollapsed) {
      return (
        <div className="relative">
          <button
            ref={websiteButtonRef}
            type="button"
            onClick={toggleWebsiteMenu}
            className={`w-full relative flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 group p-2.5 ${
              isWebsiteRoute
                ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Website"
            aria-label="Website"
          >
            <div
              className={`relative flex items-center justify-center transition-colors ${
                isWebsiteRoute ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
            >
              <Sparkles size={20} strokeWidth={isWebsiteRoute ? 2.5 : 2} />
            </div>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1 relative">
        <button
          ref={websiteButtonRef}
          type="button"
          onClick={toggleWebsiteMenu}
          className={`w-full relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group px-3 py-2.5 ${
            isWebsiteRoute
              ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isWebsiteRoute && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"></div>
          )}
          <div
            className={`relative flex items-center justify-center transition-colors ${
              isWebsiteRoute ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}
          >
            <Sparkles size={20} strokeWidth={isWebsiteRoute ? 2.5 : 2} />
          </div>
          <div className="flex-1 flex justify-between items-center ml-1">
            <span>Website</span>
            <span className="text-xs">{websiteOpen ? '-' : '+'}</span>
          </div>
        </button>
      </div>
    );
  };

  const WebsiteMenu = () => {
    if (!websiteOpen || !websiteMenuPos) return null;
    const isPortfolio = location.pathname === '/app/marketing/website/portfolio';
    const isLinkInBio = location.pathname === '/app/marketing/website/link-in-bio';

    return (
      <div
        ref={websiteMenuRef}
        className="fixed w-52 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 z-[180] transition-all duration-150"
        style={{ top: websiteMenuPos.top, left: websiteMenuPos.left }}
        role="menu"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Link
          to="/app/marketing/website/portfolio"
          onClick={() => {
            setWebsiteOpen(false);
            onClose?.();
          }}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            isPortfolio
              ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          Build Portfolio
        </Link>
        <Link
          to="/app/marketing/website/link-in-bio"
          onClick={() => {
            setWebsiteOpen(false);
            onClose?.();
          }}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            isLinkInBio
              ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          Build Link in Bio
        </Link>
      </div>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
      !isCollapsed ? (
          <div className="px-3 mb-2 mt-8 first:mt-2">
              <div className="flex items-center gap-3">
                  <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {label}
                  </h3>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/70" />
              </div>
          </div>
      ) : (
          <div className="my-2 border-t border-slate-100 dark:border-slate-800 mx-4"></div>
      )
  );

  return (
    <aside
      className={`flex flex-col h-full bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl border-r border-slate-200/70 dark:border-white/10 ${className} transition-all duration-300 ease-in-out relative z-[90]`}
      style={
        theme === 'dark'
          ? {
              backgroundImage:
                'radial-gradient(600px 420px at 40% -20%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(520px 420px at 120% 20%, rgba(99,102,241,0.10), transparent 55%)',
            }
          : undefined
      }
    >
      
      {/* Collapse Toggle (Desktop Only) */}
      {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-8 bg-white/90 dark:bg-slate-950/60 backdrop-blur border border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-300 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all z-20 hidden lg:flex items-center justify-center group"
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
      )}

      {/* Brand / Header Area */}
      <div className={`h-[72px] flex items-center flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        {isSettings ? (
            <Link to="/app/dashboard" onClick={onClose} className={`flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={18} />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">Settings</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-1">Back to Workspace</span>
                    </div>
                )}
            </Link>
        ) : (
            <Link
                to="/app/dashboard"
                onClick={onClose}
                className={`flex items-center group ${isCollapsed ? 'justify-center w-auto' : 'gap-3 w-full'}`}
                title={isCollapsed ? 'GetSoloDesk' : undefined}
                aria-label={isCollapsed ? 'GetSoloDesk' : undefined}
            >
                {isCollapsed ? (
                  <BrandMark className="w-8 h-8" tone={theme === 'dark' ? 'inverse' : 'default'} />
                ) : (
                  <div className="flex flex-col">
                    <BrandLogo className="h-8 w-auto" tone={theme === 'dark' ? 'inverse' : 'default'} />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Pro Workspace</span>
                  </div>
                )}
            </Link>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-visible custom-scrollbar ${isCollapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        
        {isSettings ? (
            // --- SETTINGS NAV ---
            <div className={isCollapsed ? 'space-y-1' : 'space-y-1.5'}>
                <SectionLabel label="Configuration" />
                <SettingsNavItem tab="profile" icon={Bot} label="AI Identity" />
                <SettingsNavItem tab="ai" icon={Sparkles} label="Intelligence" />
                
                <SectionLabel label="Account" />
                <SettingsNavItem tab="account" icon={Shield} label="Security" />
                <SettingsNavItem tab="billing" icon={CreditCard} label="Billing" />
                <SettingsNavItem tab="notifications" icon={Bell} label="Notifications" />
                
                <SectionLabel label="System" />
                <SettingsNavItem tab="danger" icon={Trash2} label="Danger Zone" />
            </div>
        ) : (
            // --- WORKSPACE NAV ---
            <div className={isCollapsed ? 'space-y-1' : 'space-y-1.5'}>
                 {/* Primary Action */}
                 <div className={isCollapsed ? 'mb-4 px-1 flex justify-center' : 'mb-6 px-1'}>
                    <Link 
                        to="/app/jobs/new"
                        onClick={onClose}
                        title={isCollapsed ? 'New Job' : undefined}
                        aria-label={isCollapsed ? 'New Job' : undefined}
                        className={
                          isCollapsed
                            ? 'group relative flex items-center justify-center w-11 h-11 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30'
                            : `flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200
                               bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 hover:-translate-y-0.5
                               px-4`
                        }
                    >
                        <Plus size={20} strokeWidth={3} />
                        {!isCollapsed && <span>New Job</span>}
                    </Link>
                </div>

                <SectionLabel label="Workspace" />
                <NavItem to="/app/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/app/jobs" icon={Briefcase} label="Jobs" />
                <NavItem to="/app/time" icon={Timer} label="Time Tracker" badge="New" />
                <NavItem to="/app/profile" icon={UserCircle} label="Profile" />
                <NavItem to="/app/templates" icon={FileText} label="Templates" />

                <SectionLabel label="Insights" />
                <NavItem to="/app/analytics" icon={BarChart2} label="Analytics" />
                <NavItem to="/app/clients" icon={Users} label="Clients" />

                <SectionLabel label="Marketing" />
                <NavItem to="/app/marketing" icon={Mail} label="Email Marketing" />
                <WebsiteGroup />
            </div>
        )}
      </div>

      {/* Footer / User Profile */}
      <div className={`${isCollapsed ? 'p-2.5' : 'p-3'} mt-auto border-t border-slate-100 dark:border-slate-800`}>
        <div className={`
            relative rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer
            ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}
        `}>
            <div
                className="flex items-center gap-3"
                onMouseEnter={() => setProfileMenuOpen(true)}
                onMouseLeave={() => setProfileMenuOpen(false)}
                onClick={() => setProfileMenuOpen((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setProfileMenuOpen((v) => !v);
                  if (e.key === 'Escape') setProfileMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
            >
                <img loading="lazy" decoding="async" 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                    alt="User" 
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 shadow-sm object-cover" 
                />
                
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                        </p>
                    </div>
                )}

                {!isCollapsed && (
                    <button 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setProfileMenuOpen((v) => !v);
                        }}
                    >
                        <MoreVertical size={16} />
                    </button>
                )}
            </div>

            {/* Profile Hover Menu */}
            <div
              className={[
                'absolute z-[120] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-1',
                'transition-all duration-150 origin-bottom-left',
                profileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2',
                // Open to the right of the profile card (like most modern sidebars).
                // This avoids covering content above and works better near the bottom edge.
                isCollapsed ? 'left-full bottom-0 ml-2 w-56' : 'left-full bottom-0 ml-2 w-64',
              ].join(' ')}
              role="menu"
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setProfileMenuOpen(true)}
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
                <button
                    onClick={() => handleProfileNav('/app/settings?tab=profile')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Settings size={16} />
                    <span>Settings</span>
                </button>
                <button
                    onClick={() => handleProfileNav('/app/updates')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Gift size={16} />
                    <span>Updates</span>
                </button>
                <button
                    onClick={() => handleProfileNav('/app/help')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <HelpCircle size={16} />
                    <span>Support</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                <button 
                    onClick={() => {
                      toggleTheme();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <button 
                    onClick={(e) => {
                      void handleSignOut(e);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
      </div>
      <WebsiteMenu />
    </aside>
  );
};







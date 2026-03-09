
import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AppErrorBoundary } from '../system/AppErrorBoundary';
import { RouteLoader } from '../system/RouteLoader';
import { BrandLogo } from '../brand/BrandLogo';
import { useTheme } from '../../context/ThemeContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sidebar collapsed state with persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
      const newState = !isSidebarCollapsed;
      setIsSidebarCollapsed(newState);
      localStorage.setItem('sidebar_collapsed', String(newState));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-transparent">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50/60 dark:bg-transparent overflow-hidden transition-colors duration-200">
      
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block ${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 h-full transition-all duration-300 ease-in-out`}>
        <Sidebar 
            className="h-full w-full" 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-72 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
             <Sidebar className="h-full w-full" onClose={() => setIsMobileMenuOpen(false)} isCollapsed={false} />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 shadow-lg z-50"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-10">
            <BrandLogo className="h-7 w-auto" tone={theme === 'dark' ? 'inverse' : 'default'} />
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>
        </div>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
             <div className="p-4 sm:p-6 lg:p-8 2xl:p-10 hd-app-container h-full flex flex-col">
                <AppErrorBoundary>
                  <Suspense fallback={<RouteLoader label="Loading page…" />}>
                    <Outlet />
                  </Suspense>
                </AppErrorBoundary>
             </div>
        </main>
      </div>
    </div>
  );
};


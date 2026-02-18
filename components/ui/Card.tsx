
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = false,
}) => {
  const variants = {
    default: `
      bg-white/70 dark:bg-slate-950/30 backdrop-blur border border-slate-200/70 dark:border-white/10
    `,
    bordered: `
      bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800
    `,
    elevated: `
      bg-white dark:bg-slate-900 shadow-lg shadow-slate-200/50 dark:shadow-none
      border border-slate-100 dark:border-slate-800
    `,
    ghost: `
      bg-transparent border border-slate-200/50 dark:border-white/5
    `,
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverClasses = hoverable
    ? 'transition-all duration-200 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-none hover:-translate-y-1 cursor-pointer animate-fade-in'
    : 'animate-fade-in';

  return (
    <div
      className={`rounded-[12px] ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, icon: Icon, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Icon size={18} />
          </div>
        )}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{children}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-bold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-slate-600 dark:text-slate-400 ${className}`}>
      {children}
    </p>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

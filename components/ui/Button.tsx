
import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold 
      transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      ${fullWidth ? 'w-full' : ''}
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-emerald-600 to-teal-600 text-white 
        hover:from-emerald-700 hover:to-teal-700 
        active:from-emerald-800 active:to-teal-800
        shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30
        dark:from-emerald-500 dark:to-teal-500 
        dark:hover:from-emerald-600 dark:hover:to-teal-600
        focus-visible:ring-emerald-500
      `,
      secondary: `
        bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300
        dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-600
        shadow-sm hover:shadow
        focus-visible:ring-slate-500
      `,
      ghost: `
        bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200
        dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700
        border border-slate-200 dark:border-slate-700
        focus-visible:ring-slate-500
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700 active:bg-red-800
        shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
        dark:bg-red-500 dark:hover:bg-red-600
        focus-visible:ring-red-500
      `,
      success: `
        bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800
        shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30
        dark:bg-emerald-500 dark:hover:bg-emerald-600
        focus-visible:ring-emerald-500
      `,
      outline: `
        bg-white/70 dark:bg-slate-950/30 backdrop-blur text-slate-900 dark:text-white
        border-2 border-slate-200 dark:border-white/10
        hover:border-emerald-500 dark:hover:border-emerald-400
        hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10
        focus-visible:ring-emerald-500
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
    };

    const iconSizes = {
      sm: 14,
      md: 16,
      lg: 18,
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={iconSizes[size]} className="animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
      </button>
    );
  }
);

Button.displayName = 'Button';

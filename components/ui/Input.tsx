
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, rightElement, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-300 transition-colors">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-[10px] border px-3 py-2.5 text-sm outline-none transition-all duration-200
              bg-white/70 dark:bg-slate-950/30 backdrop-blur
              placeholder:text-slate-400 dark:placeholder:text-slate-600
              focus:bg-white dark:focus:bg-slate-950/40 focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-950/20
              ${Icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-red-300 text-red-900 dark:border-red-800 dark:text-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30'
                  : 'border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/25 hover:border-slate-300 dark:hover:border-white/15'
              }
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

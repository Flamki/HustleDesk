
import React from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  icon = true,
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-300',
      text: 'text-blue-800 dark:text-blue-400',
      IconComponent: Info,
    },
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-900 dark:text-emerald-300',
      text: 'text-emerald-800 dark:text-emerald-400',
      IconComponent: CheckCircle,
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-300',
      text: 'text-amber-800 dark:text-amber-400',
      IconComponent: AlertCircle,
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-300',
      text: 'text-red-800 dark:text-red-400',
      IconComponent: XCircle,
    },
  };

  const { container, icon: iconColor, title: titleColor, text, IconComponent } = variants[variant];

  return (
    <div
      className={`relative rounded-[10px] border p-4 ${container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`flex-shrink-0 ${iconColor}`}>
            <IconComponent size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${titleColor}`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${text}`}>
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${iconColor} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

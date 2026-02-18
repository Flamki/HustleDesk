
import React from 'react';
import { CheckCircle2, Info, AlertCircle, XCircle } from 'lucide-react';

interface FeedbackMessageProps {
  variant: 'success' | 'info' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  variant,
  message,
  onDismiss,
  autoHide = true,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  const variants = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-900/30',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-900/30',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const { bg, border, text, icon: Icon, iconColor } = variants[variant];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border ${bg} ${border} ${text} animate-slide-in-down`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`flex-shrink-0 ${iconColor} ${variant === 'success' ? 'animate-success-pulse' : ''}`} size={20} />
      <p className="text-sm font-medium flex-1">{message}</p>
    </div>
  );
};

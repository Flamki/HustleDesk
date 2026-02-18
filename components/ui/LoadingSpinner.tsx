
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
}) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 size={sizes[size]} className="animate-spin text-emerald-600 dark:text-emerald-400" />
      {text && (
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  text?: string;
  backdrop?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text = 'Loading...',
  backdrop = true,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        backdrop ? 'bg-black/20 dark:bg-black/40 backdrop-blur-sm' : ''
      }`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-[12px] shadow-xl p-6 flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{text}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'bg-slate-200 dark:bg-slate-800 animate-pulse';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-[8px]',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variants[variant]}`}
            style={{ ...style, width: i === lines - 1 ? '60%' : style.width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

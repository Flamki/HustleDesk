import React, { Component } from 'react';
import { errorTracker } from '../../utils/errorTracking';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
  errorId?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Generate error ID for tracking
    const errorId = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Track error with error tracking service
    if (error instanceof Error) {
      errorTracker.captureException(error, {
        severity: 'fatal',
        tags: { 
          component: 'AppErrorBoundary',
          type: 'react_component_crash',
        },
        extra: {
          errorId,
          componentStack: (error as Error & { componentStack?: string }).componentStack,
        },
      });
    }
    
    this.setState({ errorId });
  }

  private reset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">This page crashed</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {this.state.message || 'An unexpected error occurred.'}
          </p>
          {this.state.errorId && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Error ID: {this.state.errorId}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

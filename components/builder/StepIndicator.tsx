import React from 'react';
import { Check } from 'lucide-react';
import type { PortfolioBuilderStep } from './builderTypes';
import { BUILDER_STEPS } from './builderData';

const STEP_LABELS: Record<PortfolioBuilderStep, string> = {
  template: 'Choose Template',
  palette: 'Color Palette',
  typography: 'Typography',
  content: 'Edit Content',
  socials: 'Links & Social',
  review: 'Preview & Deploy',
};

interface Props {
  currentStep: PortfolioBuilderStep;
  onJump: (step: PortfolioBuilderStep) => void;
}

export const StepIndicator: React.FC<Props> = ({ currentStep, onJump }) => {
  const activeIndex = BUILDER_STEPS.indexOf(currentStep);
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
      {BUILDER_STEPS.map((step, idx) => {
        const isDone = idx < activeIndex;
        const isActive = idx === activeIndex;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onJump(step)}
            className="flex items-center gap-2 min-w-0"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                isDone
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : isActive
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white text-slate-400 border-slate-300 dark:bg-slate-900 dark:border-slate-700'
              }`}
            >
              {isDone ? <Check size={13} /> : idx + 1}
            </div>
            <div className={`text-xs text-left truncate ${isActive || isDone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {STEP_LABELS[step]}
            </div>
          </button>
        );
      })}
    </div>
  );
};


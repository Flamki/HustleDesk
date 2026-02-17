import React from 'react';
import { Check, X, Circle } from 'lucide-react';
import { PasswordRequirement } from '../../types';

interface PasswordStrengthProps {
  requirements: PasswordRequirement[];
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ requirements }) => {
  return (
    <div className="space-y-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        Password Requirements
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li key={req.id} className="flex items-center space-x-2 text-xs transition-colors duration-300">
            <div className={`
              flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300
              ${req.met 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 text-transparent bg-white dark:bg-slate-900'}
            `}>
              <Check size={10} strokeWidth={3} />
            </div>
            <span className={`transition-colors duration-300 ${req.met ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
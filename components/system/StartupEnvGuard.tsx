import React from 'react';

type Props = {
  errors: string[];
  warnings: string[];
};

export const StartupEnvGuard: React.FC<Props> = ({ errors, warnings }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/40 bg-slate-900/80 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-300">Startup Blocked: Invalid Environment</h1>
        <p className="mt-3 text-slate-300">
          The app stopped at startup to prevent runtime auth failures. Fix the items below, then restart the app.
        </p>

        <div className="mt-6">
          <h2 className="text-sm uppercase tracking-wide text-red-300 font-semibold">Errors</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-red-200">
            {errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {warnings.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm uppercase tracking-wide text-amber-300 font-semibold">Warnings</h2>
            <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-amber-200">
              {warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-300">
          Check `.env.local` against `.env.example`, then run `npm run dev` again.
        </div>
      </div>
    </div>
  );
};


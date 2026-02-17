import React from 'react';
import { TYPOGRAPHY_PRESETS } from '../builderData';
import type { PortfolioBuilderState, TypographyId } from '../builderTypes';

interface Props {
  state: PortfolioBuilderState;
  onSelect: (id: TypographyId) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TypographySelection: React.FC<Props> = ({ state, onSelect, onBack, onNext }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Choose Typography</h2>
        <p className="text-slate-500 mt-2">Select fonts that match your brand personality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TYPOGRAPHY_PRESETS.map((font) => {
          const selected = state.typographyId === font.id;
          return (
            <button
              key={font.id}
              onClick={() => onSelect(font.id)}
              className={`rounded-xl border p-5 text-left ${selected ? 'border-slate-900 ring-2 ring-slate-900/20 dark:border-white dark:ring-white/20' : 'border-slate-300 dark:border-slate-700'}`}
            >
              <h3 className="text-xl font-semibold">{font.name}</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Heading</div>
                  <div style={{ fontFamily: font.heading }} className="text-4xl leading-tight font-semibold">The Quick Brown Fox</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Subheading</div>
                  <div style={{ fontFamily: font.body }} className="text-2xl">Jumps Over The Lazy Dog</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Body</div>
                  <div style={{ fontFamily: font.body }} className="text-sm">
                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <div>Heading: {font.heading}</div>
                <div>Body: {font.body}</div>
                <div>Button: {font.button}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
          Back
        </button>
        <button onClick={onNext} className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-sm font-semibold">
          Continue to Edit Content
        </button>
      </div>
    </div>
  );
};


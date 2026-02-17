import React, { useMemo, useState } from 'react';
import { PALETTE_PRESETS } from '../builderData';
import type { PaletteMeta, PaletteId, PortfolioBuilderState } from '../builderTypes';

interface Props {
  state: PortfolioBuilderState;
  onPaletteSelect: (paletteId: PaletteId, palette: PaletteMeta) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ColorPaletteSelection: React.FC<Props> = ({ state, onPaletteSelect, onBack, onNext }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState<PaletteMeta>({
    id: 'custom',
    name: 'Custom',
    primary: state.palette.primary,
    secondary: state.palette.secondary,
    accent: state.palette.accent,
    background: state.palette.background,
    text: state.palette.text,
  });

  const activePalette = useMemo(
    () => (state.paletteId === 'custom' ? custom : PALETTE_PRESETS.find((p) => p.id === state.paletteId) || state.palette),
    [state.paletteId, state.palette, custom]
  );

  const setCustomColor = (key: keyof PaletteMeta, value: string) => {
    if (key === 'id' || key === 'name') return;
    setCustom((old) => ({ ...old, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Choose Color Palette</h2>
        <p className="text-slate-500 mt-2">Select from presets or create your own custom palette</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Preset Palettes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {PALETTE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPaletteSelect(p.id, p)}
              className={`rounded-xl border p-3 ${state.paletteId === p.id ? 'border-slate-900 ring-2 ring-slate-900/20 dark:border-white dark:ring-white/20' : 'border-slate-300 dark:border-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                {[p.primary, p.secondary, p.accent, p.background, p.text].map((c, i) => (
                  <span key={`${p.id}-${i}`} className="w-7 h-7 rounded-md border border-slate-300 dark:border-slate-700" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-2 text-sm font-semibold text-left">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-4">
        <button className="text-lg font-semibold" onClick={() => setShowCustom((v) => !v)}>
          + Custom Colors
        </button>
        {showCustom ? (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['primary', 'secondary', 'accent', 'background', 'text'] as const).map((key) => (
                <label key={key} className="space-y-1">
                  <div className="text-sm font-medium capitalize">{key}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={custom[key]}
                      onChange={(e) => setCustomColor(key, e.target.value)}
                      className="w-12 h-10 rounded border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      value={custom[key]}
                      onChange={(e) => setCustomColor(key, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => onPaletteSelect('custom', custom)}
              className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-sm font-semibold"
            >
              Apply Custom Colors
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-4">
        <div className="text-xl font-semibold mb-3">Current Selection: {activePalette.name}</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['primary', 'secondary', 'accent', 'background', 'text'] as const).map((key) => (
            <div key={key} className="rounded-xl border border-slate-300 dark:border-slate-700 p-2">
              <div className="h-16 rounded-lg" style={{ background: activePalette[key] }} />
              <div className="mt-2 text-xs">
                <div className="font-semibold capitalize">{key}</div>
                <div className="text-slate-500">{activePalette[key]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
          Back
        </button>
        <button onClick={onNext} className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-sm font-semibold">
          Continue to Typography
        </button>
      </div>
    </div>
  );
};


import React from 'react';
import type { PortfolioBuilderState } from '../builderTypes';

interface Props {
  state: PortfolioBuilderState;
  onStateChange: (next: PortfolioBuilderState) => void;
  onBack: () => void;
  onNext: () => void;
}

export const LinksEditor: React.FC<Props> = ({ state, onStateChange, onBack, onNext }) => {
  const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const setSocial = (key: keyof PortfolioBuilderState['socials'], value: string) =>
    onStateChange({ ...state, socials: { ...state.socials, [key]: value } });

  const setLink = (id: string, patch: Partial<{ label: string; url: string }>) =>
    onStateChange({
      ...state,
      links: state.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  const addLink = () =>
    onStateChange({
      ...state,
      links: [...state.links, { id: makeId(), label: 'New Link', url: 'https://' }],
    });

  const removeLink = (id: string) =>
    onStateChange({
      ...state,
      links: state.links.filter((l) => l.id !== id),
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Social Links & Contact</h2>
        <p className="text-slate-500 mt-2">Add your social media profiles and contact links</p>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="GitHub" value={state.socials.github} onChange={(v) => setSocial('github', v)} />
          <Input label="LinkedIn" value={state.socials.linkedin} onChange={(v) => setSocial('linkedin', v)} />
          <Input label="Twitter (X)" value={state.socials.twitter} onChange={(v) => setSocial('twitter', v)} />
          <Input label="Dribbble" value={state.socials.dribbble} onChange={(v) => setSocial('dribbble', v)} />
          <Input label="Behance" value={state.socials.behance} onChange={(v) => setSocial('behance', v)} />
          <Input label="Instagram" value={state.socials.instagram} onChange={(v) => setSocial('instagram', v)} />
          <Input label="Facebook" value={state.socials.facebook} onChange={(v) => setSocial('facebook', v)} />
          <Input label="YouTube" value={state.socials.youtube} onChange={(v) => setSocial('youtube', v)} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-4 space-y-3">
        <h3 className="text-xl font-semibold">Button links</h3>
        {state.links.map((link, idx) => (
          <div key={link.id} className="rounded-lg border border-slate-300 dark:border-slate-700 p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label={`Link ${idx + 1} Label`} value={link.label} onChange={(v) => setLink(link.id, { label: v })} />
              <Input label={`Link ${idx + 1} URL`} value={link.url} onChange={(v) => setLink(link.id, { url: v })} />
            </div>
            <button className="rounded-lg bg-rose-600 text-white px-3 py-1 text-xs" onClick={() => removeLink(link.id)}>
              Remove Link
            </button>
          </div>
        ))}
        <button className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm" onClick={addLink}>
          Add Link
        </button>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-900/30 text-sky-800 dark:text-sky-200 text-sm px-4 py-3">
        Tip: Add full URLs to your social profiles. Leave empty any platforms you don't use.
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
          Back
        </button>
        <button onClick={onNext} className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-sm font-semibold">
          Preview & Deploy
        </button>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <div className="text-sm font-medium mb-1">{label}</div>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      placeholder="https://"
    />
  </label>
);

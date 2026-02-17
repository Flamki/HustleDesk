import React, { useMemo, useState } from 'react';
import { ChevronLeft, Monitor, Smartphone, X } from 'lucide-react';
import { LinkBioDesignPreview, LINK_BIO_THEME_PRESETS, type LinkBioThemeId, type LinkBioOverrides } from '../marketing/LinkBioDesignKit';

type Step = 'template' | 'palette' | 'typography' | 'content' | 'socials' | 'review';

type ExistingSite = {
  id: string;
  slug: string;
  template: string;
  config?: Record<string, any> | null;
};

type Palette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  surface: string;
};

type Typography = { id: string; name: string; heading: string; text: string; button: string };
type LinkItem = { id: string; label: string; url: string };
type Socials = { website: string; linkedin: string; facebook: string; instagram: string; tiktok: string; youtube: string; twitch: string };
type Content = {
  name: string;
  handle: string;
  tagline: string;
  location: string;
  avatarUrl: string;
  heroImageUrl: string;
  backgroundImageUrl: string;
  emailPlaceholder: string;
  ctaLabel: string;
};

export type LinkBioBuilderState = {
  templateId: LinkBioThemeId;
  palette: Palette;
  typography: Typography;
  content: Content;
  links: LinkItem[];
  socials: Socials;
};

const palettePresets: Palette[] = [
  { id: 'mono', name: 'Mono', primary: '#114ad1', secondary: '#7ba0f6', accent: '#114ad1', background: '#d5d5d8', text: '#0b0f19', surface: '#ffffff' },
  { id: 'mint', name: 'Mint', primary: '#a8ec9d', secondary: '#8ecf88', accent: '#a6dea6', background: '#a8d3a8', text: '#0b0f19', surface: '#ffffff' },
  { id: 'noir', name: 'Noir', primary: '#111827', secondary: '#374151', accent: '#dc2626', background: '#02050d', text: '#f8fafc', surface: '#0b1120' },
  { id: 'sunset', name: 'Sunset', primary: '#111827', secondary: '#fb923c', accent: '#ffffff', background: '#f5b27a', text: '#111827', surface: '#ffffff' },
];

const typePresets: Typography[] = [
  { id: 'modern', name: 'Modern Sans', heading: 'Inter', text: 'Inter', button: 'Inter' },
  { id: 'editorial', name: 'Editorial', heading: 'Playfair Display', text: 'Lora', button: 'Inter' },
  { id: 'tech', name: 'Tech', heading: 'Orbitron', text: 'Rajdhani', button: 'Rajdhani' },
  { id: 'friendly', name: 'Friendly', heading: 'Poppins', text: 'Open Sans', button: 'Poppins' },
];

const mkId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const steps: Step[] = ['template', 'palette', 'typography', 'content', 'socials', 'review'];
const stepLabel: Record<Step, string> = {
  template: 'Template',
  palette: 'Color Palette',
  typography: 'Typography',
  content: 'Content',
  socials: 'Links & Social',
  review: 'Preview & Deploy',
};

const defaultState: LinkBioBuilderState = {
  templateId: 'mono_classic',
  palette: palettePresets[0],
  typography: typePresets[0],
  content: {
    name: 'Your Name',
    handle: '@username',
    tagline: 'A short one-line intro about your work and audience.',
    location: 'Remote',
    avatarUrl: '',
    heroImageUrl: '',
    backgroundImageUrl: '',
    emailPlaceholder: 'Email',
    ctaLabel: 'Subscribe',
  },
  links: [
    { id: 'l1', label: 'Newsletter', url: '#' },
    { id: 'l2', label: 'Upgrade', url: '#' },
    { id: 'l3', label: 'Archive', url: '#' },
    { id: 'l4', label: 'Recommendations', url: '#' },
  ],
  socials: { website: '', linkedin: '', facebook: '', instagram: '', tiktok: '', youtube: '', twitch: '' },
};

const loadInitial = (existingSite: ExistingSite | null): LinkBioBuilderState => {
  if (!existingSite?.config) return defaultState;
  const cfg = existingSite.config as any;
  const templateRaw = String(existingSite.template || '').replace(/^linkbio_/, '') as LinkBioThemeId;
  return {
    ...defaultState,
    ...cfg,
    templateId: (templateRaw || cfg.templateId || defaultState.templateId) as LinkBioThemeId,
    palette: { ...defaultState.palette, ...(cfg.palette || {}) },
    typography: { ...defaultState.typography, ...(cfg.typography || {}) },
    content: { ...defaultState.content, ...(cfg.content || {}) },
    links: Array.isArray(cfg.links) && cfg.links.length > 0 ? cfg.links : defaultState.links,
    socials: { ...defaultState.socials, ...(cfg.socials || {}) },
  };
};

type Props = {
  existingSite: ExistingSite | null;
  onBack: () => void;
  onDeploy: (state: LinkBioBuilderState) => Promise<{ url: string | null; error: string | null }>;
};

export const LinkBioBuilder: React.FC<Props> = ({ existingSite, onBack, onDeploy }) => {
  const [step, setStep] = useState<Step>('template');
  const [state, setState] = useState<LinkBioBuilderState>(() => loadInitial(existingSite));
  const [previewModal, setPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(existingSite?.slug ? `${window.location.origin}/#/w/${existingSite.slug}` : null);
  const [error, setError] = useState<string | null>(null);

  const idx = steps.indexOf(step);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const prev = () => setStep(steps[Math.max(0, idx - 1)]);

  const previewDraft = useMemo(
    () => ({
      name: state.content.name,
      handle: state.content.handle,
      tagline: state.content.tagline,
      location: state.content.location,
      avatarUrl: state.content.avatarUrl,
      heroImageUrl: state.content.heroImageUrl,
      backgroundImageUrl: state.content.backgroundImageUrl,
      emailPlaceholder: state.content.emailPlaceholder,
      ctaLabel: state.content.ctaLabel,
      links: state.links,
    }),
    [state]
  );

  const templateShowcaseDraft = useMemo(
    () => ({
      ...previewDraft,
      links: [
        { id: 's1', label: 'Main Link', url: '#' },
        { id: 's2', label: 'Latest Drop', url: '#' },
        { id: 's3', label: 'Newsletter', url: '#' },
      ],
    }),
    [previewDraft]
  );

  const previewOverrides = useMemo<LinkBioOverrides>(
    () => ({
      palette: {
        primary: state.palette.primary,
        secondary: state.palette.secondary,
        accent: state.palette.accent,
        background: state.palette.background,
        text: state.palette.text,
        surface: state.palette.surface,
      },
      typography: {
        heading: state.typography.heading,
        text: state.typography.text,
        button: state.typography.button,
      },
      socialLinks: Object.entries(state.socials)
        .map(([label, url]) => ({ label, url: String(url || '').trim() }))
        .filter((s) => s.url.length > 0),
    }),
    [state]
  );

  const deploy = async () => {
    setSaving(true);
    setError(null);
    const result = await onDeploy(state);
    if (result.error) setError(result.error);
    setPublicUrl(result.url);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-[72px] border-b border-slate-200 dark:border-slate-800 px-5 lg:px-8 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2">
            <ChevronLeft size={14} />
            Back
          </button>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Link in Bio Builder</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{existingSite ? 'Edit existing link page' : 'Create link page'}</div>
          </div>
        </div>
      </div>

      <div className="px-5 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s, n) => (
            <button key={s} onClick={() => setStep(s)} className={`rounded-lg px-3 py-2 text-sm ${step === s ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-300 dark:border-slate-700'}`}>
              {n + 1}. {stepLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-8 py-6 space-y-6">
        {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div> : null}

        {step === 'template' ? (
          <div className="space-y-6 max-w-7xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Choose Template</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Select a base style. You can customize colors, fonts, content, and links next.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {LINK_BIO_THEME_PRESETS.map((tpl) => {
                const isActive = state.templateId === tpl.id;
                return (
                  <article
                    key={tpl.id}
                    className={`group rounded-2xl border bg-white dark:bg-slate-900 transition-colors ${
                      isActive
                        ? 'border-slate-900 dark:border-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <button onClick={() => setState((o) => ({ ...o, templateId: tpl.id }))} className="w-full text-left">
                      <div className="relative h-64 overflow-hidden rounded-t-2xl bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          {isActive ? 'Selected' : 'Template'}
                        </div>
                        <div className="origin-top-left pointer-events-none" style={{ transform: 'scale(0.2)', width: '500%', height: '500%' }}>
                          <LinkBioDesignPreview theme={tpl.id} draft={templateShowcaseDraft} />
                        </div>
                      </div>
                    </button>

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium text-slate-900 dark:text-white">{tpl.name}</h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setState((o) => ({ ...o, templateId: tpl.id }));
                            setPreviewModal(true);
                          }}
                          className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          Preview
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tpl.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 'palette' ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">Choose Color Palette</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {palettePresets.map((p) => (
                <button key={p.id} onClick={() => setState((o) => ({ ...o, palette: p }))} className={`rounded-xl border p-3 ${state.palette.id === p.id ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300'}`}>
                  <div className="flex gap-2">{[p.primary, p.secondary, p.accent, p.background, p.text].map((c, i) => <span key={`${p.id}-${i}`} className="w-7 h-7 rounded border" style={{ background: c }} />)}</div>
                  <div className="mt-2 text-sm font-semibold text-left">{p.name}</div>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-slate-300 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['primary', 'secondary', 'accent', 'background', 'text', 'surface'] as const).map((k) => (
                <label key={k} className="text-sm">
                  <div className="mb-1 capitalize">{k}</div>
                  <div className="flex gap-2">
                    <input type="color" value={state.palette[k]} onChange={(e) => setState((o) => ({ ...o, palette: { ...o.palette, id: 'custom', name: 'Custom', [k]: e.target.value } }))} className="w-12 h-10" />
                    <input value={state.palette[k]} onChange={(e) => setState((o) => ({ ...o, palette: { ...o.palette, id: 'custom', name: 'Custom', [k]: e.target.value } }))} className="flex-1 rounded border px-3 py-2" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 'typography' ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">Choose Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typePresets.map((t) => (
                <button key={t.id} onClick={() => setState((o) => ({ ...o, typography: t }))} className={`rounded-xl border p-4 text-left ${state.typography.id === t.id ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300'}`}>
                  <div className="font-semibold">{t.name}</div>
                  <div className="mt-3 text-3xl" style={{ fontFamily: t.heading }}>The Quick Brown Fox</div>
                  <div className="mt-2 text-sm" style={{ fontFamily: t.text }}>Sample body text and layout rhythm</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 'content' ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">Edit Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Name" value={state.content.name} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, name: v } }))} />
              <Input label="Handle" value={state.content.handle} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, handle: v } }))} />
              <Input label="Location" value={state.content.location} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, location: v } }))} />
              <Input label="CTA Label" value={state.content.ctaLabel} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, ctaLabel: v } }))} />
              <Input label="Avatar URL" value={state.content.avatarUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, avatarUrl: v } }))} />
              <Input label="Hero Image URL" value={state.content.heroImageUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, heroImageUrl: v } }))} />
              <Input label="Background Image URL" value={state.content.backgroundImageUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, backgroundImageUrl: v } }))} />
              <Input label="Email Placeholder" value={state.content.emailPlaceholder} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, emailPlaceholder: v } }))} />
            </div>
            <label className="block">
              <div className="text-sm font-medium mb-1">Tagline</div>
              <textarea value={state.content.tagline} onChange={(e) => setState((o) => ({ ...o, content: { ...o.content, tagline: e.target.value } }))} className="w-full rounded border px-3 py-2" rows={4} />
            </label>
          </div>
        ) : null}

        {step === 'socials' ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">Links & Social</h2>
            <div className="rounded-xl border border-slate-300 p-4 space-y-3">
              {state.links.map((l) => (
                <div key={l.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="Link Label" value={l.label} onChange={(v) => setState((o) => ({ ...o, links: o.links.map((x) => (x.id === l.id ? { ...x, label: v } : x)) }))} />
                  <Input label="Link URL" value={l.url} onChange={(v) => setState((o) => ({ ...o, links: o.links.map((x) => (x.id === l.id ? { ...x, url: v } : x)) }))} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setState((o) => ({ ...o, links: [...o.links, { id: mkId(), label: 'New Link', url: 'https://' }] }))} className="rounded border px-3 py-2 text-sm">Add Link</button>
                <button onClick={() => setState((o) => ({ ...o, links: o.links.length > 1 ? o.links.slice(0, -1) : o.links }))} className="rounded border px-3 py-2 text-sm">Remove Last</button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-300 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(state.socials) as Array<keyof Socials>).map((k) => (
                <Input key={k} label={k} value={state.socials[k]} onChange={(v) => setState((o) => ({ ...o, socials: { ...o.socials, [k]: v } }))} />
              ))}
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">Preview & Deploy</h2>
            <div className="flex gap-2">
              <button onClick={() => setPreviewModal(true)} className="rounded border px-3 py-2 text-sm">Full Screen Preview</button>
              {publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer" className="rounded border px-3 py-2 text-sm">Open Live URL</a> : null}
            </div>
            <div className="rounded-xl border border-slate-300 overflow-hidden max-h-[80vh] overflow-auto">
              <div className="max-w-xl mx-auto">
                <LinkBioDesignPreview theme={state.templateId} draft={previewDraft} overrides={previewOverrides} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={prev} className="rounded border px-4 py-2 text-sm">Back</button>
              <button onClick={() => void deploy()} disabled={saving} className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Deploying...' : 'Deploy Link in Bio'}</button>
            </div>
          </div>
        ) : null}

        {step !== 'review' ? (
          <div className="flex items-center justify-between">
            <button onClick={prev} disabled={idx === 0} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Back</button>
            <button onClick={next} className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-semibold">Continue</button>
          </div>
        ) : null}
      </div>

      {previewModal ? (
        <div className="fixed inset-0 z-[400] bg-black/45 backdrop-blur-sm p-4 md:p-6 flex items-start md:items-center justify-center overflow-y-auto" onClick={() => setPreviewModal(false)}>
          <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-4 max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Link in Bio preview</div>
              <div className="flex items-center gap-2">
                <button className={`p-2 rounded-lg border ${previewDevice === 'desktop' ? 'border-slate-900' : 'border-slate-300'}`} onClick={() => setPreviewDevice('desktop')}><Monitor size={14} /></button>
                <button className={`p-2 rounded-lg border ${previewDevice === 'mobile' ? 'border-slate-900' : 'border-slate-300'}`} onClick={() => setPreviewDevice('mobile')}><Smartphone size={14} /></button>
                <button className="p-2 rounded-lg border border-slate-300" onClick={() => setPreviewModal(false)}><X size={14} /></button>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 p-3 flex-1 min-h-0 overflow-auto">
              <div className={`mx-auto rounded-xl shadow transition-all duration-300 overflow-hidden ${previewDevice === 'desktop' ? 'w-full max-w-xl' : 'w-full max-w-sm'}`}>
                <LinkBioDesignPreview theme={state.templateId} draft={previewDraft} overrides={previewOverrides} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <div className="text-sm font-medium mb-1 capitalize">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
  </label>
);

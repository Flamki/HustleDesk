import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Monitor, Smartphone, X, Trash2, GripVertical, Plus, Check, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
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
  const [publicUrl, setPublicUrl] = useState<string | null>(existingSite?.slug ? `${window.location.origin}/w/${existingSite.slug}` : null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);

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
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setPublicUrl(result.url);
    setSaving(false);
  };

  const deleteLink = (id: string) => {
    if (state.links.length <= 1) {
      setError('You must have at least one link');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setState((o) => ({ ...o, links: o.links.filter((l) => l.id !== id) }));
  };

  const moveLink = (fromIndex: number, toIndex: number) => {
    const newLinks = [...state.links];
    const [removed] = newLinks.splice(fromIndex, 1);
    newLinks.splice(toIndex, 0, removed);
    setState((o) => ({ ...o, links: newLinks }));
  };

  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedLinkId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/html'));
    if (sourceIndex !== targetIndex) {
      moveLink(sourceIndex, targetIndex);
    }
    setDraggedLinkId(null);
  };

  const validateUrl = (url: string): boolean => {
    if (!url || url === '#') return true; // Allow empty or placeholder
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getSocialLabel = (key: keyof Socials): string => {
    const labels: Record<keyof Socials, string> = {
      website: 'Website URL',
      linkedin: 'LinkedIn URL',
      facebook: 'Facebook URL',
      instagram: 'Instagram URL',
      tiktok: 'TikTok URL',
      youtube: 'YouTube URL',
      twitch: 'Twitch URL',
    };
    return labels[key];
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-[72px] border-b border-slate-200 dark:border-slate-800 px-5 lg:px-8 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={14} />
            Back
          </button>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Link in Bio Builder</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{existingSite ? 'Edit existing link page' : 'Create link page'}</div>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
      </div>

      <div className="px-5 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s, n) => {
            const isComplete = steps.indexOf(s) < idx;
            const isCurrent = step === s;
            return (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  isCurrent
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : isComplete
                    ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                    : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isComplete && <Check size={14} />}
                <span className="truncate">
                  {n + 1}. {stepLabel[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        <div className={`overflow-y-auto px-5 lg:px-8 py-6 space-y-6 ${showPreview ? 'w-1/2' : 'w-full'}`}>
          {error ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200 px-4 py-3 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : null}

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
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Choose Color Palette</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Select a preset palette or customize your own colors.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {palettePresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setState((o) => ({ ...o, palette: p }))}
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                    state.palette.id === p.id
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex gap-2 mb-3">
                    {[p.primary, p.secondary, p.accent, p.background, p.text].map((c, i) => (
                      <span key={`${p.id}-${i}`} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-left text-slate-900 dark:text-white">{p.name}</div>
                  {state.palette.id === p.id && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Selected</div>}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Custom Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'accent', 'background', 'text', 'surface'] as const).map((k) => (
                  <div key={k}>
                    <label className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300 mb-2 block">{k}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={state.palette[k]}
                        onChange={(e) => setState((o) => ({ ...o, palette: { ...o.palette, id: 'custom', name: 'Custom', [k]: e.target.value } }))}
                        className="w-14 h-10 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                      <input
                        value={state.palette[k]}
                        onChange={(e) => setState((o) => ({ ...o, palette: { ...o.palette, id: 'custom', name: 'Custom', [k]: e.target.value } }))}
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 'typography' ? (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Choose Typography</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Select a font combination that matches your brand style.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typePresets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setState((o) => ({ ...o, typography: t }))}
                  className={`rounded-xl border p-5 text-left transition-all hover:shadow-md ${
                    state.typography.id === t.id
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white mb-2">{t.name}</div>
                  {state.typography.id === t.id && <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">Selected</div>}
                  <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: t.heading }}>
                    The Quick Brown Fox
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400" style={{ fontFamily: t.text }}>
                    Sample body text and layout rhythm for your link in bio.
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 'content' ? (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Edit Content</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Customize the text and images for your link in bio page.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputWithLimit label="Name" value={state.content.name} maxLength={50} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, name: v } }))} />
              <InputWithLimit label="Handle" value={state.content.handle} maxLength={30} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, handle: v } }))} placeholder="@username" />
              <InputWithLimit label="Location" value={state.content.location} maxLength={50} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, location: v } }))} placeholder="Remote" />
              <InputWithLimit label="CTA Label" value={state.content.ctaLabel} maxLength={20} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, ctaLabel: v } }))} />
              <InputWithLimit label="Avatar URL" value={state.content.avatarUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, avatarUrl: v } }))} placeholder="https://..." />
              <InputWithLimit label="Hero Image URL" value={state.content.heroImageUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, heroImageUrl: v } }))} placeholder="https://..." />
              <InputWithLimit label="Background Image URL" value={state.content.backgroundImageUrl} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, backgroundImageUrl: v } }))} placeholder="https://..." />
              <InputWithLimit label="Email Placeholder" value={state.content.emailPlaceholder} maxLength={30} onChange={(v) => setState((o) => ({ ...o, content: { ...o.content, emailPlaceholder: v } }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tagline</label>
                <span className="text-xs text-slate-500">{state.content.tagline.length}/150</span>
              </div>
              <textarea
                value={state.content.tagline}
                onChange={(e) => setState((o) => ({ ...o, content: { ...o.content, tagline: e.target.value.slice(0, 150) } }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="A short one-line intro about your work and audience."
              />
            </div>
          </div>
        ) : null}

        {step === 'socials' ? (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Links & Social</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Add custom links and social media profiles to your bio page.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Links</h3>
                <button
                  onClick={() => setState((o) => ({ ...o, links: [...o.links, { id: mkId(), label: 'New Link', url: 'https://' }] }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus size={14} />
                  Add Link
                </button>
              </div>

              <div className="space-y-3">
                {state.links.map((l, idx) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, l.id, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`rounded-xl border p-4 transition-all ${
                      draggedLinkId === l.id
                        ? 'border-slate-400 dark:border-slate-600 opacity-50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        className="mt-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical size={18} />
                      </button>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Link Label</label>
                          <input
                            value={l.label}
                            onChange={(e) => setState((o) => ({ ...o, links: o.links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) }))}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            Link URL
                            {!validateUrl(l.url) && l.url !== '' && <span className="ml-2 text-rose-500 text-xs">(Invalid URL)</span>}
                          </label>
                          <input
                            value={l.url}
                            onChange={(e) => setState((o) => ({ ...o, links: o.links.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x)) }))}
                            className={`w-full rounded-lg border ${
                              !validateUrl(l.url) && l.url !== '' ? 'border-rose-300 dark:border-rose-700' : 'border-slate-300 dark:border-slate-700'
                            } bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLink(l.id)}
                        className="mt-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                        aria-label="Delete link"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Social Media Links</h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(state.socials) as Array<keyof Socials>).map((k) => (
                  <div key={k}>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300 capitalize">{getSocialLabel(k)}</label>
                    <input
                      value={state.socials[k]}
                      onChange={(e) => setState((o) => ({ ...o, socials: { ...o.socials, [k]: e.target.value } }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`https://...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Preview & Deploy</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Review your link in bio and deploy it when you're ready.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPreviewModal(true)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Monitor size={14} />
                Full Screen Preview
              </button>
              {publicUrl ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  Open Live URL
                </a>
              ) : null}
            </div>

            {!showPreview && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900">
                <div className="p-4 max-w-xl mx-auto">
                  <LinkBioDesignPreview theme={state.templateId} draft={previewDraft} overrides={previewOverrides} />
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Deployment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Template:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {LINK_BIO_THEME_PRESETS.find((t) => t.id === state.templateId)?.name || state.templateId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Color Palette:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{state.palette.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Typography:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{state.typography.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Custom Links:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{state.links.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Social Links:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {Object.values(state.socials).filter((v) => v.trim()).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                onClick={prev}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => void deploy()}
                disabled={saving}
                className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Link in Bio'
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step !== 'review' ? (
          <div className="flex items-center justify-between pt-4">
            <button onClick={prev} disabled={idx === 0} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Back</button>
            <button onClick={next} className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">Continue</button>
          </div>
        ) : null}
        </div>

        {showPreview && (
          <div className="w-1/2 border-l border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-y-auto">
            <div className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-10">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Preview</div>
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg border transition-colors ${
                    previewDevice === 'desktop'
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor size={14} />
                </button>
                <button
                  className={`p-2 rounded-lg border transition-colors ${
                    previewDevice === 'mobile'
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-start justify-center min-h-full">
              <div
                className={`rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
                  previewDevice === 'desktop' ? 'w-full max-w-xl' : 'w-full max-w-sm'
                }`}
              >
                <LinkBioDesignPreview theme={state.templateId} draft={previewDraft} overrides={previewOverrides} />
              </div>
            </div>
          </div>
        )}
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
    <div className="text-sm font-medium mb-1 capitalize text-slate-700 dark:text-slate-300">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
  </label>
);

const InputWithLimit: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}> = ({ label, value, onChange, maxLength, placeholder }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{label}</label>
      {maxLength && <span className="text-xs text-slate-500">{value.length}/{maxLength}</span>}
    </div>
    <input
      value={value}
      onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder={placeholder}
    />
  </div>
);

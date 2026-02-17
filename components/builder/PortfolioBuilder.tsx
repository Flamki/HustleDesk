import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { StepIndicator } from './StepIndicator';
import { BUILDER_STEPS, DEFAULT_BUILDER_STATE, PALETTE_PRESETS, TYPOGRAPHY_PRESETS } from './builderData';
import type { PaletteId, PortfolioBuilderState, PortfolioBuilderStep, PortfolioTemplateId, TemplateCategory, TypographyId } from './builderTypes';
import { TemplateSelection } from './steps/TemplateSelection';
import { ColorPaletteSelection } from './steps/ColorPaletteSelection';
import { TypographySelection } from './steps/TypographySelection';
import { ContentEditor } from './steps/ContentEditor';
import { LinksEditor } from './steps/LinksEditor';
import { PreviewDeploy } from './steps/PreviewDeploy';
import { PortfolioDesignPreview } from '../marketing/PortfolioDesignKit';
import { mapBuilderStateToPreview } from '../marketing/portfolioPreviewMapper';
import { resolvePortfolioThemeId } from '../marketing/portfolioThemeMapping';

type ExistingSite = {
  id: string;
  slug: string;
  template: string;
  config?: Record<string, any> | null;
};

interface Props {
  existingSite: ExistingSite | null;
  onBack: () => void;
  onDeploy: (state: PortfolioBuilderState) => Promise<{ url: string | null; error: string | null }>;
}

const cloneDefault = (): PortfolioBuilderState => JSON.parse(JSON.stringify(DEFAULT_BUILDER_STATE)) as PortfolioBuilderState;

const normalizeIncomingState = (state: PortfolioBuilderState): PortfolioBuilderState => {
  const next = cloneDefault();
  next.templateId = state.templateId;
  next.category = state.category;
  next.paletteId = state.paletteId;
  next.palette = { ...next.palette, ...state.palette };
  next.typographyId = state.typographyId;
  next.typography = { ...next.typography, ...state.typography };
  next.socials = { ...next.socials, ...state.socials };
  next.links = Array.isArray(state.links) ? state.links.map((l) => ({ id: String(l.id || `${Date.now()}${Math.random()}`), label: String(l.label || ''), url: String(l.url || '') })) : next.links;

  const c = state.content;
  next.content = {
    ...next.content,
    ...c,
    stats: Array.isArray(c.stats) ? c.stats.map((x) => ({ id: String(x.id || `${Date.now()}${Math.random()}`), label: String(x.label || ''), value: String(x.value || '') })) : next.content.stats,
    services: Array.isArray(c.services) ? c.services.map((x) => ({ id: String(x.id || `${Date.now()}${Math.random()}`), title: String(x.title || ''), description: String(x.description || ''), tags: String(x.tags || '') })) : next.content.services,
    skills: Array.isArray(c.skills) ? c.skills.map((x) => ({ id: String(x.id || `${Date.now()}${Math.random()}`), name: String(x.name || ''), level: Number(x.level || 0) })) : next.content.skills,
    projects: Array.isArray(c.projects)
      ? c.projects.map((x) => ({
          id: String(x.id || `${Date.now()}${Math.random()}`),
          title: String(x.title || ''),
          category: String((x as any).category || ''),
          client: String((x as any).client || ''),
          year: String((x as any).year || ''),
          outcome: String((x as any).outcome || ''),
          link: String(x.link || ''),
          description: String(x.description || ''),
          imageUrl: String(x.imageUrl || ''),
          tags: String(x.tags || ''),
        }))
      : next.content.projects,
    experience: Array.isArray(c.experience)
      ? c.experience.map((x) => ({
          id: String(x.id || `${Date.now()}${Math.random()}`),
          role: String(x.role || ''),
          company: String(x.company || ''),
          period: String(x.period || ''),
          location: String((x as any).location || ''),
          employmentType: String((x as any).employmentType || ''),
          description: String(x.description || ''),
          achievements: String((x as any).achievements || ''),
          technologies: String((x as any).technologies || ''),
        }))
      : next.content.experience,
    education: Array.isArray(c.education)
      ? c.education.map((x) => ({
          id: String(x.id || `${Date.now()}${Math.random()}`),
          degree: String(x.degree || ''),
          institution: String(x.institution || ''),
          period: String(x.period || ''),
          details: String((x as any).details || ''),
        }))
      : next.content.education,
    testimonials: Array.isArray(c.testimonials)
      ? c.testimonials.map((x) => ({
          id: String(x.id || `${Date.now()}${Math.random()}`),
          name: String(x.name || ''),
          role: String(x.role || ''),
          company: String((x as any).company || ''),
          quote: String(x.quote || ''),
        }))
      : next.content.testimonials,
    contactFormEnabled: Boolean(c.contactFormEnabled ?? next.content.contactFormEnabled),
  };
  return next;
};

const loadInitial = (existingSite: ExistingSite | null): PortfolioBuilderState => {
  const base = cloneDefault();
  if (!existingSite?.config || typeof existingSite.config !== 'object') return base;
  const cfg = existingSite.config;
  if (cfg.templateId) base.templateId = cfg.templateId as PortfolioTemplateId;
  if (cfg.category) base.category = cfg.category as TemplateCategory;
  if (cfg.paletteId) base.paletteId = cfg.paletteId as PaletteId;
  if (cfg.palette) base.palette = { ...base.palette, ...cfg.palette };
  if (cfg.typographyId) base.typographyId = cfg.typographyId as TypographyId;
  if (cfg.typography) base.typography = { ...base.typography, ...cfg.typography };
  if (cfg.content) base.content = { ...base.content, ...cfg.content };
  if (cfg.socials) base.socials = { ...base.socials, ...cfg.socials };
  if (Array.isArray(cfg.links)) base.links = cfg.links;
  return normalizeIncomingState(base);
};

export const PortfolioBuilder: React.FC<Props> = ({ existingSite, onBack, onDeploy }) => {
  const [step, setStep] = useState<PortfolioBuilderStep>('template');
  const [state, setState] = useState<PortfolioBuilderState>(() => loadInitial(existingSite));
  const [saving, setSaving] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(existingSite?.slug ? `${window.location.origin}/w/${existingSite.slug}` : null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentStepIndex = BUILDER_STEPS.indexOf(step);

  const goNext = () => setStep(BUILDER_STEPS[Math.min(currentStepIndex + 1, BUILDER_STEPS.length - 1)]);
  const goPrev = () => setStep(BUILDER_STEPS[Math.max(currentStepIndex - 1, 0)]);

  const templatePreview = useMemo(() => {
    const { draft, overrides } = mapBuilderStateToPreview(state);
    return <PortfolioDesignPreview themeId={resolvePortfolioThemeId(state.templateId)} draft={draft} overrides={overrides} />;
  }, [state]);

  const deploy = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    const result = await onDeploy(state);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setPublicUrl(result.url);
    setNotice(existingSite ? 'Portfolio updated successfully.' : 'Portfolio deployed successfully.');
    setSaving(false);
  };

  const applyPalette = (paletteId: PaletteId) => {
    const p = PALETTE_PRESETS.find((x) => x.id === paletteId);
    if (!p) return;
    setState((old) => ({ ...old, paletteId, palette: p }));
  };

  const applyTypography = (typographyId: TypographyId) => {
    const t = TYPOGRAPHY_PRESETS.find((x) => x.id === typographyId);
    if (!t) return;
    setState((old) => ({ ...old, typographyId, typography: t }));
  };

  const copyUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setNotice('Public URL copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-[72px] border-b border-slate-200 dark:border-slate-800 px-5 lg:px-8 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Portfolio Builder</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{existingSite ? 'Edit existing portfolio site' : 'Create portfolio site'}</div>
          </div>
        </div>
      </div>

      <div className="px-5 lg:px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <StepIndicator currentStep={step} onJump={setStep} />
      </div>

      {(error || notice) && (
        <div className={`mx-5 lg:mx-8 mt-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-200' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
          {error || notice}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-8 py-6">
        {step === 'template' ? (
          <TemplateSelection
            state={state}
            onCategoryChange={(category) => setState((old) => ({ ...old, category }))}
            onTemplateChange={(templateId) => setState((old) => ({ ...old, templateId }))}
            onNext={goNext}
          />
        ) : null}

        {step === 'palette' ? (
          <ColorPaletteSelection
            state={state}
            onPaletteSelect={(paletteId, palette) => setState((old) => ({ ...old, paletteId, palette }))}
            onBack={goPrev}
            onNext={goNext}
          />
        ) : null}

        {step === 'typography' ? (
          <TypographySelection
            state={state}
            onSelect={(id) => applyTypography(id)}
            onBack={goPrev}
            onNext={goNext}
          />
        ) : null}

        {step === 'content' ? (
          <ContentEditor
            state={state}
            onStateChange={setState}
            onBack={goPrev}
            onNext={goNext}
          />
        ) : null}

        {step === 'socials' ? (
          <LinksEditor state={state} onStateChange={setState} onBack={goPrev} onNext={goNext} />
        ) : null}

        {step === 'review' ? (
          <PreviewDeploy
            state={state}
            publicUrl={publicUrl}
            saving={saving}
            onBack={goPrev}
            onDeploy={() => void deploy()}
            onCopyUrl={() => void copyUrl()}
            preview={templatePreview}
          />
        ) : null}
      </div>
    </div>
  );
};

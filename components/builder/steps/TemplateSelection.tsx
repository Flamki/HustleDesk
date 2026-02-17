import React, { useMemo, useState } from 'react';
import { Monitor, Smartphone, X } from 'lucide-react';
import { PORTFOLIO_TEMPLATES } from '../builderData';
import type { PortfolioBuilderState, PortfolioTemplateId, TemplateCategory } from '../builderTypes';
import { PortfolioDesignPreview } from '../../marketing/PortfolioDesignKit';
import { mapBuilderStateToPreview } from '../../marketing/portfolioPreviewMapper';
import { resolvePortfolioThemeId } from '../../marketing/portfolioThemeMapping';

interface Props {
  state: PortfolioBuilderState;
  onCategoryChange: (value: TemplateCategory) => void;
  onTemplateChange: (value: PortfolioTemplateId) => void;
  onNext: () => void;
}

export const TemplateSelection: React.FC<Props> = ({ state, onCategoryChange: _onCategoryChange, onTemplateChange, onNext }) => {
  const [preview, setPreview] = useState<{ templateId: PortfolioTemplateId; name: string } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const mapped = useMemo(() => mapBuilderStateToPreview(state), [state]);
  const templatePreviewMap = useMemo(() => {
    const base = mapped;
    return {
      creative_bold: base,
      tech_developer: {
        draft: {
          ...base.draft,
          name: 'Kenji Takeda',
          role: 'Bushido Developer',
          heroLabel: 'Samurai Engineering',
          heroHeadline: 'Precision Through Craft',
          heroSubheadline: 'Disciplined engineering, thoughtful design, and dependable delivery.',
          aboutTitle: 'The Way of Building',
        },
        overrides: {
          ...base.overrides,
          palette: {
            ...base.overrides.palette,
            primary: '#0a0a0a',
            core: '#f8f7f0',
            secondary: '#d4d4d4',
            tertiary: '#1a1a1a',
            accent: '#8b0000',
          },
          typography: {
            ...base.overrides.typography,
            heading: 'Noto Serif JP',
            text: 'Cormorant Garamond',
          },
        },
      },
      modern_gradient: {
        draft: {
          ...base.draft,
          name: 'Nova Chen',
          role: 'Digital Architect',
          heroLabel: '// Cyber Systems',
          heroHeadline: 'Build The Future',
          heroSubheadline: 'High-performance web systems with immersive interfaces and neon energy.',
          aboutTitle: 'Neon Studio',
        },
        overrides: {
          ...base.overrides,
          palette: {
            ...base.overrides.palette,
            primary: '#0a0e27',
            core: '#0a0e27',
            secondary: '#00f0ff',
            tertiary: '#9befff',
            accent: '#ff006e',
          },
          typography: {
            ...base.overrides.typography,
            heading: 'Orbitron',
            text: 'Rajdhani',
          },
        },
      },
      classic_elegant: {
        draft: {
          ...base.draft,
          name: 'Arabella Saint-Claire',
          role: 'Digital Atelier',
          heroLabel: 'Creative Director & Developer',
          heroHeadline: 'Timeless Digital Luxury',
          heroSubheadline: 'Bespoke digital experiences where elegance meets strategic execution.',
          aboutTitle: 'Atelier Philosophy',
        },
        overrides: {
          ...base.overrides,
          palette: {
            ...base.overrides.palette,
            primary: '#0f1419',
            core: '#faf8f3',
            secondary: '#2d5f5d',
            tertiary: '#2a2e35',
            accent: '#d4af37',
          },
          typography: {
            ...base.overrides.typography,
            heading: 'Bodoni Moda',
            text: 'Montserrat',
          },
        },
      },
      vibrant_creative: {
        draft: {
          ...base.draft,
          name: 'Luna Evergreen',
          role: 'Creative Developer',
          heroLabel: 'hello, I am',
          heroHeadline: 'Grow With Intention',
          heroSubheadline: 'Nature-inspired digital experiences rooted in clarity, care, and thoughtful craftsmanship.',
          aboutTitle: 'Core Values',
        },
        overrides: {
          ...base.overrides,
          palette: {
            ...base.overrides.palette,
            primary: '#3e5436',
            core: '#faf8f3',
            secondary: '#8a9a7f',
            tertiary: '#8b7355',
            accent: '#d4845c',
          },
          typography: {
            ...base.overrides.typography,
            heading: 'Josefin Sans',
            text: 'Lora',
          },
        },
      },
    } as const;
  }, [mapped]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Choose Your Template</h2>
        <p className="text-slate-500 mt-2">Choose a portfolio style. Every section and detail remains fully editable in next steps.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {PORTFOLIO_TEMPLATES.map((template) => (
          (() => {
            const isActive = state.templateId === template.id;
            const palette = templatePreviewMap[template.id].overrides.palette;
            return (
          <div
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTemplateChange(template.id);
              }
            }}
            role="button"
            tabIndex={0}
            className={`rounded-xl overflow-hidden border text-left transition-all ${
              isActive
                ? 'border-slate-900 ring-2 ring-slate-900/20 dark:border-white dark:ring-white/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="h-80 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              {isActive ? (
                <div className="origin-top-left pointer-events-none" style={{ transform: 'scale(0.24)', width: '416.6667%', height: '416.6667%' }}>
                  <PortfolioDesignPreview
                    themeId={resolvePortfolioThemeId(template.id)}
                    draft={templatePreviewMap[template.id].draft}
                    overrides={templatePreviewMap[template.id].overrides}
                  />
                </div>
              ) : (
                <div className="h-full p-5 flex flex-col justify-between" style={{ background: palette?.core || '#f8fafc', color: palette?.tertiary || '#0f172a' }}>
                  <div className="text-xs uppercase tracking-[0.16em] opacity-70">{template.category}</div>
                  <div>
                    <div className="text-3xl font-bold leading-tight">{template.name.split(' - ')[0]}</div>
                    <div className="mt-2 text-sm opacity-75 line-clamp-2">{template.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-3 flex-1 rounded" style={{ background: palette?.primary || '#111827' }} />
                    <span className="h-3 flex-1 rounded" style={{ background: palette?.accent || '#e11d48' }} />
                    <span className="h-3 flex-1 rounded" style={{ background: palette?.secondary || '#94a3b8' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">{template.name}</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview({ templateId: template.id, name: template.name });
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-300"
              >
                Preview
              </button>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={onNext} className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-2.5 font-semibold text-sm">
          Continue to Color Palette
        </button>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-[400] bg-black/45 backdrop-blur-sm p-4 md:p-6 flex items-start md:items-center justify-center overflow-y-auto" onClick={() => setPreview(null)}>
          <div className="w-full max-w-6xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-4 max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{preview.name} preview</div>
              <div className="flex items-center gap-2">
                <button className={`p-2 rounded-lg border ${previewDevice === 'desktop' ? 'border-slate-900' : 'border-slate-300 dark:border-slate-700'}`} onClick={() => setPreviewDevice('desktop')}>
                  <Monitor size={14} />
                </button>
                <button className={`p-2 rounded-lg border ${previewDevice === 'mobile' ? 'border-slate-900' : 'border-slate-300 dark:border-slate-700'}`} onClick={() => setPreviewDevice('mobile')}>
                  <Smartphone size={14} />
                </button>
                <button className="p-2 rounded-lg border border-slate-300 dark:border-slate-700" onClick={() => setPreview(null)}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div
              className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex-1 min-h-0 overflow-auto"
              data-template-preview-scroll="true"
            >
              <div className={`mx-auto rounded-xl shadow transition-all duration-300 overflow-hidden ${previewDevice === 'desktop' ? 'w-full max-w-5xl' : 'w-full max-w-sm'}`}>
                <PortfolioDesignPreview
                  themeId={resolvePortfolioThemeId(preview.templateId)}
                  draft={templatePreviewMap[preview.templateId].draft}
                  overrides={templatePreviewMap[preview.templateId].overrides}
                  viewport={previewDevice}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

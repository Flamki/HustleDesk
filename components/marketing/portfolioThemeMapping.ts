import type { PortfolioTemplateId } from '../builder/builderTypes';
import type { PortfolioThemeId } from './PortfolioDesignKit';

export const portfolioTemplateThemeMap: Record<PortfolioTemplateId, PortfolioThemeId> = {
  creative_bold: 'designer_canvas',
  tech_developer: 'developer_casefiles',
  modern_gradient: 'motion_neon',
  minimal_pro: 'designer_canvas',
  artistic_visual: 'designer_canvas',
  classic_elegant: 'consultant_trust',
  vibrant_creative: 'writer_editorial',
  academic_research: 'designer_canvas',
};

export const resolvePortfolioThemeId = (template: string | undefined | null): PortfolioThemeId => {
  const raw = String(template || '').trim();
  if (!raw) return 'designer_canvas';

  const normalized = raw.startsWith('portfolio_') ? raw.replace(/^portfolio_/, '') : raw;

  if (normalized in portfolioTemplateThemeMap) {
    return portfolioTemplateThemeMap[normalized as PortfolioTemplateId];
  }

  const allowed: PortfolioThemeId[] = [
    'designer_canvas',
    'developer_casefiles',
    'writer_editorial',
    'photographer_grid',
    'consultant_trust',
    'agency_impact',
    'product_story',
    'architect_form',
    'marketer_funnel',
    'motion_neon',
  ];

  return allowed.includes(normalized as PortfolioThemeId) ? (normalized as PortfolioThemeId) : 'designer_canvas';
};

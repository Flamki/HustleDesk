import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Link2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSite, listSites, updateSite } from '../services/marketingWebsiteService';
import type { PortfolioBuilderState } from '../components/builder/builderTypes';
import type { LinkBioBuilderState } from '../components/linkbioBuilder/LinkBioBuilder';

const PortfolioBuilder = React.lazy(async () => {
  const mod = await import('../components/builder/PortfolioBuilder');
  return { default: mod.PortfolioBuilder };
});

const LinkBioBuilder = React.lazy(async () => {
  const mod = await import('../components/linkbioBuilder/LinkBioBuilder');
  return { default: mod.LinkBioBuilder };
});

type Site = Awaited<ReturnType<typeof listSites>>['sites'][number];
type Kind = 'link_in_bio' | 'portfolio';

const inferKind = (site: Site): Kind => {
  if (site.site_kind === 'link_in_bio' || site.site_kind === 'portfolio') return site.site_kind;
  return String(site.template || '').startsWith('linkbio_') ? 'link_in_bio' : 'portfolio';
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

export const MarketingWebsitePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [buildersPrefetched, setBuildersPrefetched] = useState(false);
  const mode = useMemo<'chooser' | 'portfolio' | 'linkbio'>(() => {
    if (location.pathname === '/app/marketing/website/portfolio') return 'portfolio';
    if (location.pathname === '/app/marketing/website/link-in-bio') return 'linkbio';
    return 'chooser';
  }, [location.pathname]);

  const prefetchBuilders = () => {
    if (buildersPrefetched) return;
    setBuildersPrefetched(true);
    void import('../components/builder/PortfolioBuilder');
    void import('../components/linkbioBuilder/LinkBioBuilder');
  };

  const refreshSites = async () => {
    setError(null);
    setLoading(true);
    const result = await listSites();
    if (result.error) {
      setError(result.error.message);
      setSites([]);
      setLoading(false);
      return;
    }
    setSites(result.sites);
    setLoading(false);
  };

  useEffect(() => {
    void refreshSites();
  }, []);

  useEffect(() => {
    const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    if (idle) {
      const id = idle(() => prefetchBuilders(), { timeout: 1200 });
      return () => {
        const cancel = (window as any).cancelIdleCallback as ((callbackId: number) => void) | undefined;
        if (cancel) cancel(id);
      };
    }
    const t = window.setTimeout(() => prefetchBuilders(), 900);
    return () => window.clearTimeout(t);
  }, []);

  const existingLinkBio = useMemo(() => sites.find((s) => inferKind(s) === 'link_in_bio') || null, [sites]);
  const existingPortfolio = useMemo(() => sites.find((s) => inferKind(s) === 'portfolio') || null, [sites]);

  const deployPortfolio = async (state: PortfolioBuilderState): Promise<{ url: string | null; error: string | null }> => {
    const payload = {
      name: 'Portfolio Site',
      slug:
        existingPortfolio?.slug ||
        slugify(`portfolio-${state.content.fullName || 'creator'}-${Math.random().toString().slice(2, 7)}`),
      template: `portfolio_${state.templateId}`,
      site_kind: 'portfolio' as const,
      headline: state.content.professionalTitle,
      subheadline: state.content.bio,
      cta_text: state.content.primaryCtaLabel || 'Contact',
      show_email_signup: true,
      show_portfolio: true,
      published: true,
      primary_color: state.palette.primary,
      accent_color: state.palette.accent,
      config: {
        ...state,
        content: state.content,
        socials: state.socials,
        links: state.links,
      },
    };

    const result = existingPortfolio
      ? await updateSite(existingPortfolio.id, payload as any)
      : await createSite(payload as any);

    if (result.error) {
      return {
        url: result.site?.slug ? `${window.location.origin}/w/${result.site.slug}` : null,
        error: result.error.message,
      };
    }

    await refreshSites();
    return { url: result.site?.slug ? `${window.location.origin}/w/${result.site.slug}` : null, error: null };
  };

  const deployLinkBio = async (state: LinkBioBuilderState): Promise<{ url: string | null; error: string | null }> => {
    const payload = {
      name: 'Link in Bio',
      slug:
        existingLinkBio?.slug ||
        slugify(`linkbio-${state.content.name || 'creator'}-${Math.random().toString().slice(2, 7)}`),
      template: `linkbio_${state.templateId}`,
      site_kind: 'link_in_bio' as const,
      headline: state.content.handle || state.content.name,
      subheadline: state.content.tagline,
      cta_text: state.content.ctaLabel || 'Subscribe',
      show_email_signup: true,
      show_portfolio: true,
      published: true,
      primary_color: state.palette.primary,
      accent_color: state.palette.accent,
      config: state,
    };

    const result = existingLinkBio
      ? await updateSite(existingLinkBio.id, payload as any)
      : await createSite(payload as any);

    if (result.error) {
      return {
        url: result.site?.slug ? `${window.location.origin}/w/${result.site.slug}` : null,
        error: result.error.message,
      };
    }
    await refreshSites();
    return { url: result.site?.slug ? `${window.location.origin}/w/${result.site.slug}` : null, error: null };
  };

  if (loading && sites.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500">Loading builder...</div>
      </div>
    );
  }

  if (mode === 'portfolio') {
    return (
      <Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto"><div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500">Loading portfolio builder...</div></div>}>
        <PortfolioBuilder
          existingSite={
            existingPortfolio
              ? {
                  id: existingPortfolio.id,
                  slug: existingPortfolio.slug,
                  template: existingPortfolio.template,
                  config: existingPortfolio.config || {},
                }
              : null
          }
          onBack={() => navigate('/app/marketing/website')}
          onDeploy={deployPortfolio}
        />
      </Suspense>
    );
  }

  if (mode === 'linkbio') {
    return (
      <Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto"><div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500">Loading link in bio builder...</div></div>}>
        <LinkBioBuilder
          existingSite={
            existingLinkBio
              ? {
                  id: existingLinkBio.id,
                  slug: existingLinkBio.slug,
                  template: existingLinkBio.template,
                  config: existingLinkBio.config || {},
                }
              : null
          }
          onBack={() => navigate('/app/marketing/website')}
          onDeploy={deployLinkBio}
        />
      </Suspense>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Website - Builder</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          One user can have only one Link in Bio and one Portfolio site.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-200 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <button
          onClick={() => navigate('/app/marketing/website/link-in-bio')}
          onMouseEnter={prefetchBuilders}
          onFocus={prefetchBuilders}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-left hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Link2 size={22} />
            </div>
            <span className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {existingLinkBio ? 'Edit existing' : 'Create'}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-4 text-slate-900 dark:text-white">Link in Bio</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Build and publish your link-in-bio with templates, custom colors, fonts, and links.
          </p>
          {existingLinkBio?.published_at ? (
            <div className="text-xs text-emerald-600 mt-3">Published: /w/{existingLinkBio.slug}</div>
          ) : null}
        </button>

        <button
          onClick={() => navigate('/app/marketing/website/portfolio')}
          onMouseEnter={prefetchBuilders}
          onFocus={prefetchBuilders}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-left hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <BriefcaseBusiness size={22} />
            </div>
            <span className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {existingPortfolio ? 'Edit existing' : 'Create'}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-4 text-slate-900 dark:text-white">Portfolio Site</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Build and publish your portfolio in a guided full-screen workflow.
          </p>
          {existingPortfolio?.published_at ? (
            <div className="text-xs text-emerald-600 mt-3">Published: /w/{existingPortfolio.slug}</div>
          ) : null}
        </button>
      </div>
    </div>
  );
};

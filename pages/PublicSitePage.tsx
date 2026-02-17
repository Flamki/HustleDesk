import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Check, ExternalLink, Globe, Loader2, Mail } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { fetchPublicSite, submitPublicSignup, trackPublicSiteEvent } from '../services/marketingWebsiteService';
import { LinkBioDesignPreview, type LinkBioThemeId } from '../components/marketing/LinkBioDesignKit';
import { PortfolioDesignPreview } from '../components/marketing/PortfolioDesignKit';
import { mapPublicSiteToPreview } from '../components/marketing/portfolioPreviewMapper';
import { resolvePortfolioThemeId } from '../components/marketing/portfolioThemeMapping';

type PublicData = NonNullable<Awaited<ReturnType<typeof fetchPublicSite>>['data']>;

const LINK_BIO_THEME_IDS: LinkBioThemeId[] = [
  'mono_classic',
  'mint_pop',
  'noir_card',
  'sunset_glow',
  'starlight_grid',
  'tokyo_red',
  'sky_frost',
  'paper_minimal',
  'deep_space',
  'rose_mono',
];

const clampHex = (value: string, fallback: string) => {
  const v = (value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  return fallback;
};

const Background: React.FC<{ styleName: string }> = ({ styleName }) => {
  if (styleName === 'grid') {
    return (
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />
    );
  }
  if (styleName === 'plain') {
    return <div className="absolute inset-0 bg-slate-950" />;
  }
  // aurora default
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(900px 540px at 20% 10%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(760px 520px at 80% 30%, rgba(34,197,94,0.12), transparent 55%), radial-gradient(900px 560px at 50% 110%, rgba(14,165,233,0.10), transparent 60%)',
      }}
    />
  );
};

const TemplateStudio: React.FC<{ data: PublicData }> = ({ data }) => {
  const site = data.site;
  const portfolio = data.portfolio || [];

  const primary = clampHex(site.primary_color, '#6366F1');
  const accent = clampHex(site.accent_color, '#22C55E');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    const { ok, error: err } = await submitPublicSignup(site.slug, { email, name, consent });
    if (!ok || err) {
      setStatus('error');
      setError(err?.message || 'Signup failed');
      return;
    }
    setStatus('success');
    setEmail('');
    setName('');
    void trackPublicSiteEvent(site.slug, 'signup');
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        backgroundColor: '#020617',
      }}
    >
      <Background styleName={site.background_style} />
      <div className="absolute inset-0 opacity-20 [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {site.logo_url ? (
              <img loading="lazy" decoding="async" src={site.logo_url} alt={site.name || 'Logo'} className="w-10 h-10 rounded-xl object-cover bg-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Globe size={18} className="text-white/80" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold tracking-tight text-white truncate">{site.name || site.slug}</div>
              <div className="text-xs text-white/60 truncate">{site.slug}</div>
            </div>
          </div>
          <a
            href="#signup"
            className="px-4 py-2 rounded-xl font-bold text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            {site.cta_text || 'Get updates'}
          </a>
        </header>

        <main className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              Portfolio and updates
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {site.headline || 'Build trust. Win better clients.'}
            </h1>
            <p className="mt-4 text-white/70 text-lg leading-relaxed max-w-xl">
              {site.subheadline || 'A simple page with my work and an email signup for updates.'}
            </p>

            {site.show_portfolio && (
              <section className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Selected work</h2>
                  <div className="text-xs text-white/50">{portfolio.length} items</div>
                </div>
                <div className="space-y-3">
                  {portfolio.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60 text-sm">
                      No portfolio items yet.
                    </div>
                  ) : (
                    portfolio.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{p.title}</div>
                            {p.description && <div className="mt-1 text-white/70 text-sm leading-relaxed">{p.description}</div>}
                            {Array.isArray(p.tags) && p.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {p.tags.slice(0, 6).map((t) => (
                                  <Badge key={t} variant="neutral">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => void trackPublicSiteEvent(site.slug, 'link_click', { label: p.title || 'portfolio_link', url: p.url })}
                              className="shrink-0 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-bold flex items-center gap-2"
                            >
                              <ExternalLink size={16} />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>

          {site.show_email_signup && (
            <div className="lg:col-span-5" id="signup">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                    style={{ background: `linear-gradient(135deg, ${primary}22, ${accent}18)` }}
                  >
                    <Mail size={18} className="text-white/90" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Get updates</div>
                    <div className="text-sm text-white/60">Occasional emails. Unsubscribe anytime.</div>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="mt-5 space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Name (optional)"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email address"
                    required
                    type="email"
                    autoComplete="email"
                  />
                  <label className="flex items-start gap-3 text-sm text-white/70">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>I agree to receive emails about updates and new work.</span>
                  </label>

                  {status === 'error' && error && (
                    <div className="rounded-xl border border-rose-900/40 bg-rose-900/20 text-rose-200 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}
                  {status === 'success' && (
                    <div className="rounded-xl border border-emerald-900/40 bg-emerald-900/20 text-emerald-200 px-4 py-3 text-sm flex items-center gap-2">
                      <Check size={16} />
                      Subscribed.
                    </div>
                  )}

                  <button
                    disabled={status === 'loading'}
                    className="w-full px-4 py-3 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 transition-colors"
                    style={{
                      background: `linear-gradient(90deg, ${primary}, ${accent})`,
                      opacity: status === 'loading' ? 0.75 : 1,
                    }}
                  >
                    {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {site.cta_text || 'Get updates'}
                  </button>

                  <div className="text-xs text-white/50">
                    By subscribing you acknowledge you can unsubscribe at any time.
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-14 pt-8 border-t border-white/10 text-xs text-white/50 flex items-center justify-between">
          <span>Powered by HustleDesk</span>
          <span>{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
};

const TemplateLinkBio: React.FC<{ data: PublicData }> = ({ data }) => {
  const site = data.site;
  const portfolio = data.portfolio || [];
  const rawTheme = String(site.template || '').replace(/^linkbio_/, '') as LinkBioThemeId;
  const theme: LinkBioThemeId = LINK_BIO_THEME_IDS.includes(rawTheme) ? rawTheme : 'mono_classic';
  const cfg = (site.config && typeof site.config === 'object' ? site.config : {}) as any;
  const content = (cfg.content && typeof cfg.content === 'object' ? cfg.content : {}) as any;
  const socials = (cfg.socials && typeof cfg.socials === 'object' ? cfg.socials : {}) as Record<string, string>;
  const cfgLinks = Array.isArray(cfg.links) ? cfg.links : [];
  const links = cfgLinks.length > 0
    ? cfgLinks.map((row: any, idx: number) => ({ id: String(row?.id || `l${idx + 1}`), label: String(row?.label || `Link ${idx + 1}`), url: String(row?.url || '#') }))
    : portfolio.length > 0
      ? portfolio.map((p) => ({ id: p.id, label: p.title || 'Link', url: p.url || '#' }))
      : [
          { id: 'l1', label: 'Newsletter', url: '#' },
          { id: 'l2', label: 'Upgrade', url: '#' },
          { id: 'l3', label: 'Archive', url: '#' },
          { id: 'l4', label: 'Recommendations', url: '#' },
        ];

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.show_email_signup) return;
    setStatus('loading');
    setError(null);
    const { ok, error: err } = await submitPublicSignup(site.slug, { email, consent: true });
    if (!ok || err) {
      setStatus('error');
      setError(err?.message || 'Signup failed');
      return;
    }
    setStatus('success');
    setEmail('');
    void trackPublicSiteEvent(site.slug, 'signup');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <LinkBioDesignPreview
          theme={theme}
          draft={{
            name: content.name || site.name || 'Your Name',
            handle: content.handle || (site.headline?.startsWith('@') ? site.headline : undefined),
            tagline: content.tagline || site.subheadline || 'A short one-line intro about your work and audience.',
            location: content.location || '',
            avatarUrl: content.avatarUrl || '',
            heroImageUrl: content.heroImageUrl || '',
            backgroundImageUrl: content.backgroundImageUrl || '',
            emailPlaceholder: content.emailPlaceholder || 'Email',
            ctaLabel: site.cta_text || 'Subscribe',
            links,
          }}
          overrides={{
            palette: {
              primary: cfg?.palette?.primary || site.primary_color || '',
              secondary: cfg?.palette?.secondary || '',
              accent: cfg?.palette?.accent || site.accent_color || '',
              background: cfg?.palette?.background || '',
              text: cfg?.palette?.text || '',
              surface: cfg?.palette?.surface || '',
            },
            typography: {
              heading: cfg?.typography?.heading || '',
              text: cfg?.typography?.text || '',
              button: cfg?.typography?.button || '',
            },
            socialLinks: Object.entries(socials)
              .map(([label, url]) => ({ label, url: String(url || '').trim() }))
              .filter((row) => row.url.length > 0),
          }}
          onLinkClick={(link) => void trackPublicSiteEvent(site.slug, 'link_click', { label: link.label, url: link.url })}
        />

        {site.show_email_signup ? (
          <form onSubmit={onSignup} className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
            <div className="text-sm font-semibold text-white/80 mb-3">Subscribe by email</div>
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900/70 border border-white/10 text-white outline-none"
                placeholder="Email address"
                type="email"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold disabled:opacity-70"
              >
                {status === 'loading' ? 'Sending...' : site.cta_text || 'Subscribe'}
              </button>
            </div>
            {status === 'success' ? <div className="text-emerald-300 text-xs mt-2">Subscribed.</div> : null}
            {status === 'error' && error ? <div className="text-rose-300 text-xs mt-2">{error}</div> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
};

const TemplatePortfolio: React.FC<{ data: PublicData }> = ({ data }) => {
  const site = data.site;
  const portfolio = data.portfolio || [];
  const themeId = resolvePortfolioThemeId(site.template);
  const mapped = mapPublicSiteToPreview(site as any, portfolio as any);

  return (
    <div className="min-h-screen bg-slate-950">
      <PortfolioDesignPreview
        themeId={themeId}
        draft={mapped.draft}
        overrides={mapped.overrides}
      />
    </div>
  );
};

export const PublicSitePage: React.FC = () => {
  const { slug } = useParams();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const s = String(slug || '').trim();
      if (!s) {
        setError('Missing site slug');
        setLoading(false);
        return;
      }
      const { data, error } = await fetchPublicSite(s);
      if (!mounted) return;
      if (error || !data) {
        setError(error?.message || 'Site not found');
        setData(null);
        setLoading(false);
        return;
      }
      setData(data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data?.site?.slug) return;
    void trackPublicSiteEvent(data.site.slug, 'session_start');
    void trackPublicSiteEvent(data.site.slug, 'page_view');
  }, [data?.site?.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 size={18} className="animate-spin" />
          Loading site...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-2xl font-extrabold">Site unavailable</div>
          <div className="mt-2 text-white/60">{error || 'Not found'}</div>
        </div>
      </div>
    );
  }

  const looksLikeLinkBio =
    String(data.site.template || '').startsWith('linkbio_') ||
    /link in bio/i.test(String(data.site.headline || '')) ||
    /generated from link in bio setup/i.test(String(data.site.subheadline || ''));

  if (looksLikeLinkBio) {
    return <TemplateLinkBio data={data} />;
  }
  if (String(data.site.template || '').startsWith('portfolio_')) {
    return <TemplatePortfolio data={data} />;
  }
  return <TemplateStudio data={data} />;
};


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const setCache = (res, value) => {
  res.setHeader('Cache-Control', value);
};

const getQueryParams = (req) => {
  if (req.query) return req.query;
  try {
    const u = new URL(req.url, 'http://localhost');
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { error: 'Server not configured' });

  const params = getQueryParams(req);
  const slug = String(params.slug || '').trim().toLowerCase();
  if (!slug) return json(res, 400, { error: 'slug is required' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const primarySelect =
    'id,user_id,slug,name,template,site_kind,config,headline,subheadline,cta_text,logo_url,show_email_signup,show_portfolio,primary_color,accent_color,background_style,published_at';
  const fallbackSelect =
    'id,user_id,slug,name,template,headline,subheadline,cta_text,logo_url,show_email_signup,show_portfolio,primary_color,accent_color,background_style,published_at';

  let site = null;
  let siteError = null;

  const primaryResult = await admin.from('marketing_sites').select(primarySelect).eq('slug', slug).maybeSingle();
  site = primaryResult.data;
  siteError = primaryResult.error;

  // Backward compatibility for projects where migration adding `site_kind/config` has not been applied yet.
  if (siteError?.message && /column .*site_kind.* does not exist/i.test(siteError.message)) {
    const fallbackResult = await admin.from('marketing_sites').select(fallbackSelect).eq('slug', slug).maybeSingle();
    site = fallbackResult.data;
    siteError = fallbackResult.error;
    if (site) {
      site = { ...site, site_kind: String(site.template || '').startsWith('linkbio_') ? 'link_in_bio' : 'portfolio', config: {} };
    }
  }

  if (siteError) return json(res, 500, { error: siteError.message });
  if (!site || !site.published_at) {
    // Short cache for misses to reduce repeated cold traffic on invalid slugs.
    setCache(res, 'public, s-maxage=30, stale-while-revalidate=120');
    return json(res, 404, { error: 'Site not found' });
  }

  const isLinkBioTemplate = String(site.template || '').startsWith('linkbio_');
  let items = [];
  if (site.show_portfolio || isLinkBioTemplate) {
    const { data: rows, error: itemsError } = await admin
      .from('marketing_portfolio_items')
      .select('id,title,description,url,tags,sort_order,created_at')
      .eq('site_id', site.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (itemsError) return json(res, 500, { error: itemsError.message });
    items = rows || [];
  }

  // Public site payload is safe to cache at the edge.
  setCache(res, 'public, s-maxage=300, stale-while-revalidate=86400');
  return json(res, 200, { site, portfolio: items });
}


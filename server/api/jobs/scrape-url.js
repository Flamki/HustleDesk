import { secureJson } from '../_shared/security.js';
import { extractBearerToken } from '../_shared/auth.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// ═══════════════════════════════════════════════════════════
// Job URL Scraper — extract job details from Upwork, Fiverr,
// LinkedIn, and generic job URLs.
// ═══════════════════════════════════════════════════════════

const PLATFORM_PATTERNS = [
  { pattern: /upwork\.com/i, platform: 'Upwork' },
  { pattern: /fiverr\.com/i, platform: 'Fiverr' },
  { pattern: /linkedin\.com/i, platform: 'LinkedIn' },
  { pattern: /freelancer\.com/i, platform: 'Other' },
  { pattern: /toptal\.com/i, platform: 'Other' },
];

const detectPlatform = (url) => {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return 'Other';
};

const extractText = (html, regex, group = 1) => {
  const match = html.match(regex);
  return match?.[group]?.trim() || '';
};

const stripHtml = (html) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractMetaContent = (html, name) => {
  // Try property first (og:), then name
  const propMatch = html.match(new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'));
  if (propMatch) return propMatch[1].trim();

  const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return nameMatch?.[1]?.trim() || '';
};

const parseUpwork = (html) => {
  // Try JSON-LD structured data first
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  let jsonLd = null;
  if (jsonLdMatch) {
    try { jsonLd = JSON.parse(jsonLdMatch[1]); } catch { /* ignore */ }
  }

  let title = '';
  let description = '';
  let company = '';
  let budgetMin = '';
  let budgetMax = '';
  let currency = 'USD';

  // Title
  title = jsonLd?.title || jsonLd?.name || '';
  if (!title) title = extractText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!title) title = extractMetaContent(html, 'og:title');
  // Clean title
  title = stripHtml(title).replace(/\s*[-|]\s*Upwork$/i, '').trim();

  // Description
  if (jsonLd?.description) {
    description = jsonLd.description;
  } else {
    // Try main content area
    const descMatch = html.match(/class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/class=["'][^"']*job-description[^"']*["'][^>]*>([\s\S]*?)<\/section>/i);
    if (descMatch) description = stripHtml(descMatch[1]);
  }
  if (!description) description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description');
  description = stripHtml(description);

  // Budget
  const budgetMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)\s*[-–]\s*\$\s*([\d,]+(?:\.\d{2})?)/);
  if (budgetMatch) {
    budgetMin = budgetMatch[1].replace(/,/g, '');
    budgetMax = budgetMatch[2].replace(/,/g, '');
  } else {
    const fixedMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (fixedMatch) {
      budgetMax = fixedMatch[1].replace(/,/g, '');
    }
  }

  // Company
  const companyMatch = html.match(/class=["'][^"']*client[^"']*name[^"']*["'][^>]*>([\s\S]*?)<\//i);
  if (companyMatch) company = stripHtml(companyMatch[1]);

  if (jsonLd?.baseSalary) {
    const salary = jsonLd.baseSalary;
    if (salary.value?.minValue) budgetMin = String(salary.value.minValue);
    if (salary.value?.maxValue) budgetMax = String(salary.value.maxValue);
    if (salary.currency) currency = salary.currency;
  }

  return { title, description, company, budgetMin, budgetMax, currency, platform: 'Upwork' };
};

const parseFiverr = (html) => {
  let title = extractMetaContent(html, 'og:title') || extractText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  title = stripHtml(title).replace(/\s*[-|]\s*Fiverr$/i, '').trim();
  
  let description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description');
  description = stripHtml(description);

  const priceMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  const budgetMax = priceMatch ? priceMatch[1].replace(/,/g, '') : '';

  return { title, description, company: '', budgetMin: '', budgetMax, currency: 'USD', platform: 'Fiverr' };
};

const parseLinkedIn = (html) => {
  let title = extractMetaContent(html, 'og:title') || extractText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  title = stripHtml(title).replace(/\s*[-|]\s*LinkedIn$/i, '').trim();

  let description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description');
  description = stripHtml(description);

  const companyMatch = html.match(/class=["'][^"']*company[^"']*["'][^>]*>([\s\S]*?)<\//i);
  const company = companyMatch ? stripHtml(companyMatch[1]) : '';

  return { title, description, company, budgetMin: '', budgetMax: '', currency: 'USD', platform: 'LinkedIn' };
};

const parseGeneric = (html, platform) => {
  let title = extractMetaContent(html, 'og:title') || extractText(html, /<title>([\s\S]*?)<\/title>/i);
  title = stripHtml(title);

  let description = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description');
  if (!description) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      description = stripHtml(bodyMatch[1]).slice(0, 2000);
    }
  }
  description = stripHtml(description);

  const priceMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  const budgetMax = priceMatch ? priceMatch[1].replace(/,/g, '') : '';

  return { title, description, company: '', budgetMin: '', budgetMax, currency: 'USD', platform };
};

const scrapeJobUrl = async (jobUrl) => {
  const platform = detectPlatform(jobUrl);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (HTTP ${response.status})`);
    }

    const html = await response.text();
    
    let result;
    switch (platform) {
      case 'Upwork':
        result = parseUpwork(html);
        break;
      case 'Fiverr':
        result = parseFiverr(html);
        break;
      case 'LinkedIn':
        result = parseLinkedIn(html);
        break;
      default:
        result = parseGeneric(html, platform);
    }

    // Truncate description to reasonable length
    if (result.description && result.description.length > 5000) {
      result.description = result.description.slice(0, 5000) + '...';
    }

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out (10s)' : err.message || 'Failed to scrape URL',
    };
  } finally {
    clearTimeout(timeout);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return secureJson(res, 405, { error: 'Method not allowed' });

  const token = extractBearerToken(req);
  if (!token) return secureJson(res, 401, { error: 'Unauthorized' });

  // Verify user
  if (url && anonKey) {
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { error } = await supabase.auth.getUser();
    if (error) return secureJson(res, 401, { error: 'Unauthorized' });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return secureJson(res, 400, { error: 'Invalid JSON body' });
  }

  const jobUrl = String(body?.url || '').trim();
  if (!jobUrl) return secureJson(res, 400, { error: 'URL is required' });

  // Basic URL validation
  try {
    new URL(jobUrl);
  } catch {
    return secureJson(res, 400, { error: 'Invalid URL format' });
  }

  const result = await scrapeJobUrl(jobUrl);
  
  if (!result.success) {
    return secureJson(res, 422, { error: result.error });
  }

  return secureJson(res, 200, {
    success: true,
    ...result.data,
  });
}

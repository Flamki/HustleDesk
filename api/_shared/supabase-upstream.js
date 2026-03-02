import dns from 'node:dns/promises';

const HOST_CACHE_TTL_MS = 5 * 60 * 1000;
const hostReachabilityCache = new Map();

const trimOuterQuotes = (value) => value.replace(/^['"]+|['"]+$/g, '');
const normalizeValue = (value) => trimOuterQuotes(String(value || '').trim());
const normalizeBaseUrl = (value) => normalizeValue(value).replace(/\/+$/, '');

const splitCandidateList = (value) =>
  normalizeValue(value)
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const isProxyLoopUrl = (value) => {
  if (!isValidHttpUrl(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.pathname.replace(/\/+$/, '').endsWith('/api/sb');
  } catch {
    return false;
  }
};

const toUsableUrl = (value) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return null;
  if (!isValidHttpUrl(normalized)) return null;
  if (isProxyLoopUrl(normalized)) return null;
  return normalized;
};

const unique = (items) => {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
};

const isHostReachable = async (host, timeoutMs = 1200) => {
  const cached = hostReachabilityCache.get(host);
  if (cached && Date.now() - cached.ts < HOST_CACHE_TTL_MS) {
    return cached.ok;
  }

  let ok = false;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs));
  try {
    const lookup = dns.lookup(host).then(() => true).catch(() => false);
    ok = await Promise.race([lookup, timeout]);
  } catch {
    ok = false;
  }

  hostReachabilityCache.set(host, { ok, ts: Date.now() });
  return ok;
};

export const getSupabaseUpstreamCandidates = (env = process.env) => {
  const raw = [
    env.SUPABASE_URL,
    env.SUPABASE_FALLBACK_URL,
    ...splitCandidateList(env.SUPABASE_UPSTREAM_URLS),
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.VITE_SUPABASE_URL,
  ];

  return unique(raw.map(toUsableUrl).filter(Boolean));
};

export const chooseReachableSupabaseUpstream = async (candidates) => {
  const checked = [];
  for (const candidate of candidates) {
    let host = 'unknown';
    try {
      host = new URL(candidate).hostname;
    } catch {
      host = 'unknown';
    }

    const reachable = await isHostReachable(host);
    checked.push({ url: candidate, host, reachable });
    if (reachable) {
      return { selected: candidate, checked };
    }
  }
  return { selected: null, checked };
};

export const ensureSupabaseRuntimeEnv = async (env = process.env) => {
  const candidates = getSupabaseUpstreamCandidates(env);
  if (candidates.length === 0) {
    return {
      selected: null,
      candidates: [],
      prioritized: [],
      checked: [],
      reason: 'No usable Supabase upstream candidates were found in environment variables.',
    };
  }

  const { selected, checked } = await chooseReachableSupabaseUpstream(candidates);
  const preferred = selected || candidates[0];
  const prioritized = unique([preferred, ...candidates]);

  env.SUPABASE_URL = preferred;

  return {
    selected: preferred,
    candidates,
    prioritized,
    checked,
    reason: selected ? null : 'No candidate host was DNS-reachable; defaulting to first configured URL.',
  };
};

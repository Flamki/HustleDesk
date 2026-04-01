import { ensureSupabaseRuntimeEnv } from '../_shared/supabase-upstream.js';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const REQUEST_HEADERS_TO_SKIP = new Set([
  'host',
  'content-length',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'cf-connecting-ip',
]);

const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  // Node fetch may decode upstream bodies before we forward them.
  // Forwarding original encoding/length can cause browser decode failures.
  'content-encoding',
  'content-length',
]);

const EXPECTS_JSON_PREFIXES = ['/auth/v1', '/rest/v1'];
const NON_JSON_AUTH_PATH_PREFIXES = ['/auth/v1/authorize'];
const UPSTREAM_HEALTH_KEY = '__getsolodesk_supabase_upstream_health__';
const MAX_BACKOFF_MS = 10 * 60 * 1000;
const BASE_BACKOFF_MS = 15 * 1000;

const getUpstreamHealthMap = () => {
  if (!globalThis[UPSTREAM_HEALTH_KEY]) {
    globalThis[UPSTREAM_HEALTH_KEY] = new Map();
  }
  return globalThis[UPSTREAM_HEALTH_KEY];
};

const readHealth = (baseUrl) => {
  const map = getUpstreamHealthMap();
  return map.get(baseUrl) || { fails: 0, cooldownUntil: 0, lastSuccessAt: 0 };
};

const markFailure = (baseUrl) => {
  const map = getUpstreamHealthMap();
  const prev = readHealth(baseUrl);
  const fails = Math.min(prev.fails + 1, 8);
  const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (fails - 1));
  map.set(baseUrl, {
    fails,
    cooldownUntil: Date.now() + backoff,
    lastSuccessAt: prev.lastSuccessAt || 0,
  });
};

const markSuccess = (baseUrl) => {
  const map = getUpstreamHealthMap();
  map.set(baseUrl, { fails: 0, cooldownUntil: 0, lastSuccessAt: Date.now() });
};

const orderUpstreams = (urls) => {
  const now = Date.now();
  return [...urls].sort((a, b) => {
    const aHealth = readHealth(a);
    const bHealth = readHealth(b);
    const aCooling = aHealth.cooldownUntil > now ? 1 : 0;
    const bCooling = bHealth.cooldownUntil > now ? 1 : 0;
    if (aCooling !== bCooling) return aCooling - bCooling;
    if (aHealth.lastSuccessAt !== bHealth.lastSuccessAt) {
      return bHealth.lastSuccessAt - aHealth.lastSuccessAt;
    }
    return 0;
  });
};

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const getRawBody = async (req) => {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');

  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : null;
};

const buildForwardHeaders = (incomingHeaders) => {
  const next = {};
  for (const [key, value] of Object.entries(incomingHeaders || {})) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    if (REQUEST_HEADERS_TO_SKIP.has(lower)) continue;
    next[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return next;
};

export default async function handler(req, res) {
  const selection = await ensureSupabaseRuntimeEnv(process.env);
  if (!selection.selected || selection.prioritized.length === 0) {
    return json(res, 500, {
      error: 'SUPABASE_URL is not configured for proxy mode',
      details: selection.reason,
    });
  }

  const incoming = new URL(req.url || '/', 'http://localhost');
  const prefix = '/api/sb';
  if (!incoming.pathname.startsWith(prefix)) {
    return json(res, 404, { error: 'Not found' });
  }

  const targetPath = incoming.pathname.slice(prefix.length);
  const method = String(req.method || 'GET').toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await getRawBody(req);
  const upstreamErrors = [];
  const defaultTimeoutMs = targetPath.startsWith('/auth/v1') ? 15000 : 10000;
  const timeoutMs = Math.max(5000, Number(process.env.SUPABASE_PROXY_TIMEOUT_MS || defaultTimeoutMs));
  const upstreamOrder = orderUpstreams(selection.prioritized);

  for (const baseUrl of upstreamOrder) {
    const targetUrl = `${baseUrl}${targetPath}${incoming.search}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const upstream = await fetch(targetUrl, {
        method,
        headers: buildForwardHeaders(req.headers || {}),
        body: body || undefined,
        redirect: 'manual',
        signal: controller.signal,
      });

      const contentType = String(upstream.headers.get('content-type') || '').toLowerCase();
      const expectsJsonBase = EXPECTS_JSON_PREFIXES.some((prefix) => targetPath.startsWith(prefix));
      const allowsNonJson = NON_JSON_AUTH_PATH_PREFIXES.some((prefix) => targetPath.startsWith(prefix));
      const expectsJson = expectsJsonBase && !allowsNonJson;
      if (expectsJson && !contentType.includes('application/json')) {
        const sample = (await upstream.text()).slice(0, 120);
        markFailure(baseUrl);
        upstreamErrors.push({
          upstream: new URL(baseUrl).hostname,
          reason: 'non-json-response',
          details: sample,
        });
        continue;
      }

      if (upstream.status >= 500) {
        markFailure(baseUrl);
        upstreamErrors.push({
          upstream: new URL(baseUrl).hostname,
          reason: `upstream-${upstream.status}`,
        });
        continue;
      }

      res.statusCode = upstream.status;
      upstream.headers.forEach((value, key) => {
        if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) return;
        res.setHeader(key, value);
      });

      markSuccess(baseUrl);
      res.setHeader('x-supabase-upstream', new URL(baseUrl).hostname);
      res.setHeader('x-supabase-proxy-timeout-ms', String(timeoutMs));
      const payload = Buffer.from(await upstream.arrayBuffer());
      res.end(payload);
      return;
    } catch (err) {
      const reason =
        err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          ? 'timeout'
          : 'network-error';
      markFailure(baseUrl);
      upstreamErrors.push({ upstream: new URL(baseUrl).hostname, reason });
    } finally {
      clearTimeout(timeout);
    }
  }

  const latestError = upstreamErrors[upstreamErrors.length - 1] || null;
  return json(res, 502, {
    error: 'Failed to reach upstream Supabase',
    attempted_upstreams: upstreamErrors.map((item) => item.upstream),
    reason: latestError?.reason || 'unknown',
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export const __private = {
  readHealth,
  markFailure,
  markSuccess,
  orderUpstreams,
};

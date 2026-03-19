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
    if (lower === 'host' || lower === 'content-length') continue;
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
  const timeoutMs = Math.max(5000, Number(process.env.SUPABASE_PROXY_TIMEOUT_MS || 12000));

  for (const baseUrl of selection.prioritized) {
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
        upstreamErrors.push({
          upstream: new URL(baseUrl).hostname,
          reason: 'non-json-response',
          details: sample,
        });
        continue;
      }

      res.statusCode = upstream.status;
      upstream.headers.forEach((value, key) => {
        if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) return;
        res.setHeader(key, value);
      });

      res.setHeader('x-supabase-upstream', new URL(baseUrl).hostname);
      const payload = Buffer.from(await upstream.arrayBuffer());
      res.end(payload);
      return;
    } catch (err) {
      const reason =
        err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          ? 'timeout'
          : 'network-error';
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

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
]);

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

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

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
  const baseUrl = normalizeBaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  if (!baseUrl) {
    return json(res, 500, { error: 'SUPABASE_URL is not configured for proxy mode' });
  }

  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    return json(res, 500, { error: 'SUPABASE_URL must be a valid URL' });
  }

  // Safety guard: prevent accidental self-proxy loops.
  const basePath = parsedBase.pathname.replace(/\/+$/, '');
  if (basePath.endsWith('/api/sb')) {
    return json(res, 500, { error: 'SUPABASE_URL cannot point to /api/sb (proxy loop detected)' });
  }

  const incoming = new URL(req.url || '/', 'http://localhost');
  const prefix = '/api/sb';
  if (!incoming.pathname.startsWith(prefix)) {
    return json(res, 404, { error: 'Not found' });
  }

  const targetPath = incoming.pathname.slice(prefix.length);
  const targetUrl = `${baseUrl}${targetPath}${incoming.search}`;
  const method = String(req.method || 'GET').toUpperCase();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const body = method === 'GET' || method === 'HEAD' ? undefined : await getRawBody(req);
    const upstream = await fetch(targetUrl, {
      method,
      headers: buildForwardHeaders(req.headers || {}),
      body: body || undefined,
      signal: controller.signal,
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    const payload = Buffer.from(await upstream.arrayBuffer());
    res.end(payload);
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
        ? 'Supabase proxy request timed out'
        : 'Failed to reach upstream Supabase';
    return json(res, 502, { error: message });
  } finally {
    clearTimeout(timeout);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

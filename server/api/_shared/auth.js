const trim = (value) => String(value || '').trim();

const normalizeOrigin = (value) => {
  const raw = trim(value).replace(/^['"]+|['"]+$/g, '').replace(/(?:\\r\\n|\\n|\\r)+$/g, '');
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
};

const firstHeader = (req, name) => {
  const value = req?.headers?.[name];
  if (Array.isArray(value)) return trim(value[0] || '');
  return trim(value);
};

const isLocalHost = (host) => {
  const h = String(host || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
};

const getRequestOrigin = (req) => {
  const forwardedProto = firstHeader(req, 'x-forwarded-proto');
  const forwardedHost = firstHeader(req, 'x-forwarded-host');
  const host = forwardedHost || firstHeader(req, 'host');
  if (!host) return '';

  // Host may include port. Keep it, but reject clearly invalid characters.
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return '';

  const proto = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : 'https';
  return `${proto}://${host}`;
};

export const resolveAuthRedirectOrigin = (req) => {
  const envCandidates = [
    process.env.VITE_AUTH_REDIRECT_ORIGIN,
    process.env.APP_BASE_URL,
    process.env.PUBLIC_APP_URL,
  ];

  const requestOrigin = normalizeOrigin(getRequestOrigin(req));
  const normalizedCandidates = [...envCandidates.map(normalizeOrigin), requestOrigin].filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';
  for (const candidate of normalizedCandidates) {
    try {
      const host = new URL(candidate).hostname;
      if (isProd && isLocalHost(host)) continue;
      return candidate;
    } catch {
      // Ignore invalid candidate.
    }
  }

  if (!isProd) return 'http://localhost:5173';
  return '';
};

export const extractBearerToken = (req) => {
  const authHeader = firstHeader(req, 'authorization');
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = trim(match[1]);
  if (!token || token.length > 4096) return null;
  // Accept JWT/base64url-like bearer tokens.
  if (!/^[A-Za-z0-9\-._~+/]+=*$/.test(token)) return null;
  return token;
};


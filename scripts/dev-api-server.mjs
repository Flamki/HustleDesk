import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const API_PORT = Number(process.env.API_PORT || 8787);

// Minimal .env loader so the API server sees the same env as Vite.
const loadDotEnvFile = (filePath) => {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
};

loadDotEnvFile(path.join(repoRoot, '.env.local'));
loadDotEnvFile(path.join(repoRoot, '.env'));

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const getQuery = (urlString) => {
  try {
    const u = new URL(urlString, 'http://localhost');
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
};

const resolveApiModulePath = (pathname) => {
  if (!pathname.startsWith('/api')) return null;
  const rest = pathname.replace(/^\/api\/?/, ''); // remove leading /api
  if (!rest) return path.join(repoRoot, 'api', '[...path].js');

  const direct = path.join(repoRoot, 'api', `${rest}.js`);
  if (existsSync(direct)) return direct;

  const asIndex = path.join(repoRoot, 'api', rest, 'index.js');
  if (existsSync(asIndex)) return asIndex;

  const catchAll = path.join(repoRoot, 'api', '[...path].js');
  if (existsSync(catchAll)) return catchAll;

  return null;
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;

  if (!pathname.startsWith('/api')) {
    return json(res, 404, { error: 'Not found' });
  }

  const modPath = resolveApiModulePath(pathname);
  if (!modPath) {
    return json(res, 404, { error: `No route for ${pathname}` });
  }

  try {
    // Attach req.query + req.body for handlers that expect them (Vercel-style).
    req.query = getQuery(req.url || '/');

    const rawBody = await readRawBody(req);
    if (rawBody.length) {
      // Keep as string for Stripe signature verification.
      req.body = rawBody.toString('utf8');
    }

    // Default to module caching for speed. Enable hot reload only when explicitly requested.
    const hotReload = process.env.DEV_API_HOT_RELOAD === '1';
    const importUrl = pathToFileURL(modPath).href + (hotReload ? `?t=${Date.now()}` : '');
    const mod = await import(importUrl);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      return json(res, 500, { error: `Invalid handler export for ${pathname}` });
    }

    await handler(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return json(res, 500, { error: message });
  }
});

server.listen(API_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[dev-api] listening on http://localhost:${API_PORT}`);
});

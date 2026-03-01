import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const handlersRoot = path.resolve(__dirname, '..', 'server', 'api');

const getQuery = (urlString) => {
  try {
    const u = new URL(urlString || '/', 'http://localhost');
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
};

const resolveModulePath = (pathname) => {
  if (!pathname || !pathname.startsWith('/api')) return null;

  // Support dedicated proxy route even when this catch-all is invoked first.
  if (pathname.startsWith('/api/sb/')) {
    const supabaseProxyRoute = path.resolve(__dirname, 'sb', '[...path].js');
    if (existsSync(supabaseProxyRoute)) return supabaseProxyRoute;
  }

  const rest = pathname.replace(/^\/api\/?/, '');
  if (!rest) return null;

  const direct = path.join(handlersRoot, `${rest}.js`);
  if (existsSync(direct)) return direct;

  const asIndex = path.join(handlersRoot, rest, 'index.js');
  if (existsSync(asIndex)) return asIndex;

  return null;
};

export default async function handler(req, res) {
  try {
    const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '/';
    const modPath = resolveModulePath(pathname);

    if (!modPath) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `No route for ${pathname}` }));
      return;
    }

    if (!req.query) req.query = getQuery(req.url || '/');

    const rawBody = await readRawBody(req);
    req.rawBody = rawBody;
    if (!req.body && rawBody.length) req.body = rawBody.toString('utf8');

    const mod = await import(pathToFileURL(modPath).href);
    const routeHandler = mod?.default;

    if (typeof routeHandler !== 'function') {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Invalid handler export for ${pathname}` }));
      return;
    }

    await routeHandler(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const STATE_KEY = '__getsolodesk_rate_limiter_state__';

const getState = () => {
  if (!globalThis[STATE_KEY]) {
    globalThis[STATE_KEY] = new Map();
  }
  return globalThis[STATE_KEY];
};

const now = () => Date.now();

export const getClientIp = (req) => {
  const fromForwarded = req?.headers?.['x-forwarded-for'];
  if (typeof fromForwarded === 'string' && fromForwarded.trim()) {
    return fromForwarded.split(',')[0].trim();
  }
  const fallback =
    req?.headers?.['x-real-ip'] ||
    req?.headers?.['x-vercel-forwarded-for'] ||
    req?.headers?.['cf-connecting-ip'] ||
    '';
  return String(fallback || '').trim() || 'unknown';
};

export const checkRateLimit = ({ key, limit, windowMs }) => {
  const state = getState();
  const timestamp = now();
  const safeKey = String(key || 'unknown');
  const max = Math.max(1, Number(limit || 1));
  const window = Math.max(1000, Number(windowMs || 60000));

  let entry = state.get(safeKey);
  if (!entry || timestamp - entry.windowStart >= window) {
    entry = { windowStart: timestamp, count: 0 };
  }

  entry.count += 1;
  state.set(safeKey, entry);

  const remaining = Math.max(0, max - entry.count);
  const resetMs = Math.max(0, window - (timestamp - entry.windowStart));
  const allowed = entry.count <= max;

  return {
    allowed,
    remaining,
    retryAfterSeconds: Math.ceil(resetMs / 1000),
    resetAt: entry.windowStart + window,
  };
};

const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

const hasUpstashConfig = () => Boolean(UPSTASH_URL && UPSTASH_TOKEN);

const parsePipelineResult = (payload, index) => {
  const item = payload?.result?.[index];
  if (item && typeof item === 'object' && 'result' in item) return item.result;
  return item;
};

const upstashPipeline = async (commands) => {
  const response = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash pipeline failed (${response.status})`);
  }

  const payload = await response.json();
  return payload;
};

export const checkRateLimitGlobal = async ({ key, limit, windowMs }) => {
  if (!hasUpstashConfig()) {
    return checkRateLimit({ key, limit, windowMs });
  }

  const safeKey = String(key || 'unknown');
  const max = Math.max(1, Number(limit || 1));
  const window = Math.max(1000, Number(windowMs || 60000));

  try {
    const firstPass = await upstashPipeline([
      ['INCR', safeKey],
      ['PTTL', safeKey],
    ]);

    const current = Number(parsePipelineResult(firstPass, 0) || 0);
    let ttlMs = Number(parsePipelineResult(firstPass, 1) || -1);

    if (ttlMs < 0) {
      const expirePass = await upstashPipeline([
        ['PEXPIRE', safeKey, window],
        ['PTTL', safeKey],
      ]);
      ttlMs = Number(parsePipelineResult(expirePass, 1) || window);
    }

    const remaining = Math.max(0, max - current);
    const retryAfterSeconds = Math.max(1, Math.ceil(Math.max(0, ttlMs) / 1000));
    return {
      allowed: current <= max,
      remaining,
      retryAfterSeconds,
      resetAt: Date.now() + Math.max(0, ttlMs),
      store: 'upstash',
    };
  } catch {
    // Fail-safe fallback to local limiter to avoid hard downtime if Redis is unreachable.
    return { ...checkRateLimit({ key: safeKey, limit: max, windowMs: window }), store: 'memory' };
  }
};


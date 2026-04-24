const DEFAULT_FIREWORKS_BASE_URL = 'https://api.fireworks.ai/inference/v1';
const DEFAULT_FIREWORKS_MODEL = 'accounts/fireworks/models/llama-v3p3-70b-instruct';

const asTrimmedString = (value) => String(value || '').trim();

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getFireworksConfig = () => {
  const apiKey = asTrimmedString(process.env.FIREWORKS_API_KEY || process.env.VITE_FIREWORKS_API_KEY);
  const baseUrl = asTrimmedString(process.env.FIREWORKS_BASE_URL || DEFAULT_FIREWORKS_BASE_URL).replace(/\/+$/, '');
  const model = asTrimmedString(process.env.FIREWORKS_MODEL || DEFAULT_FIREWORKS_MODEL);
  return { apiKey, baseUrl, model };
};

export const hasFireworksConfig = () => {
  const { apiKey } = getFireworksConfig();
  return Boolean(apiKey);
};

export const callFireworksChat = async ({
  messages,
  temperature = 0.35,
  maxTokens = 900,
  model,
}) => {
  const cfg = getFireworksConfig();
  if (!cfg.apiKey) {
    const err = new Error('FIREWORKS_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  const payload = {
    model: model || cfg.model,
    messages: Array.isArray(messages) ? messages : [],
    temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      body?.error?.message ||
      body?.error ||
      `Fireworks API request failed (${response.status})`;
    const err = new Error(String(message));
    err.statusCode = response.status;
    throw err;
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    const err = new Error('Fireworks API returned an empty completion');
    err.statusCode = 502;
    throw err;
  }

  return {
    content: content.trim(),
    usage: body?.usage || null,
    model: body?.model || payload.model,
  };
};

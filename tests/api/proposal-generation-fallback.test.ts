import { beforeEach, describe, expect, it, vi } from 'vitest';

const fireworksMock = vi.hoisted(() => ({
  hasFireworksConfig: vi.fn(),
  callFireworksChat: vi.fn(),
}));

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock('../../server/api/_shared/fireworks.js', () => ({
  hasFireworksConfig: fireworksMock.hasFireworksConfig,
  callFireworksChat: fireworksMock.callFireworksChat,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

const createMockResponse = () => {
  const result = { statusCode: 0, body: '' };
  const res = {
    setHeader: vi.fn(),
    removeHeader: vi.fn(),
    end: (payload: string) => {
      result.body = payload;
    },
    set statusCode(code: number) {
      result.statusCode = code;
    },
    get statusCode() {
      return result.statusCode;
    },
  };
  return { res, result };
};

describe('AI proposal endpoint fallback behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.FIREWORKS_API_KEY = 'fw_test_key';
  });

  it('falls back to deterministic proposal when Fireworks fails', async () => {
    fireworksMock.hasFireworksConfig.mockReturnValue(true);
    fireworksMock.callFireworksChat.mockRejectedValue(new Error('upstream timeout'));

    const jobsQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: 'job_1',
          title: 'Landing page redesign',
          company: 'Acme Studio',
          platform: 'Upwork',
          job_description: 'Need conversion-focused redesign for SaaS landing page.',
          budget_min: 300,
          budget_max: 800,
          currency: 'USD',
          notes: 'Prioritize speed and clean UX.',
        },
        error: null,
      })),
    };
    jobsQuery.select.mockReturnValue(jobsQuery);
    jobsQuery.eq.mockReturnValue(jobsQuery);

    const usersQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: { ai_credits_limit: 5, ai_credits_used: 1 },
        error: null,
      })),
    };
    usersQuery.select.mockReturnValue(usersQuery);
    usersQuery.eq.mockReturnValue(usersQuery);

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: 'user_1' } },
          error: null,
        })),
      },
      from: vi.fn((table: string) => (table === 'jobs' ? jobsQuery : usersQuery)),
    });

    const { default: handler } = await import('../../server/api/ai/proposal.js');
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer test-access-token' },
      body: {
        jobId: 'job_1',
        settings: { tone: 'professional', length: 'standard', highlights: [] },
        profile: { yearsExperience: 4, skills: ['React', 'TypeScript'] },
      },
    };
    const { res, result } = createMockResponse();

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(200);
    const payload = JSON.parse(result.body);
    expect(payload.provider).toBe('fallback');
    expect(String(payload.proposal || '')).not.toHaveLength(0);
    expect(String(payload.warning || '')).toContain('Fireworks generation failed');
  });

  it('returns Fireworks proposal when upstream succeeds', async () => {
    fireworksMock.hasFireworksConfig.mockReturnValue(true);
    fireworksMock.callFireworksChat.mockResolvedValue({
      content: 'Hi there, I can deliver this project end-to-end with clean execution.',
    });

    const jobsQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: 'job_2',
          title: 'Full-stack app',
          company: 'Client',
          platform: 'Upwork',
          job_description: 'Build full-stack app',
          budget_min: 1000,
          budget_max: 2000,
          currency: 'USD',
          notes: null,
        },
        error: null,
      })),
    };
    jobsQuery.select.mockReturnValue(jobsQuery);
    jobsQuery.eq.mockReturnValue(jobsQuery);

    const usersQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: { ai_credits_limit: 10, ai_credits_used: 2 },
        error: null,
      })),
    };
    usersQuery.select.mockReturnValue(usersQuery);
    usersQuery.eq.mockReturnValue(usersQuery);

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: 'user_2' } },
          error: null,
        })),
      },
      from: vi.fn((table: string) => (table === 'jobs' ? jobsQuery : usersQuery)),
    });

    const { default: handler } = await import('../../server/api/ai/proposal.js');
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer test-access-token' },
      body: {
        jobId: 'job_2',
        settings: { tone: 'confident', length: 'concise', highlights: [] },
        profile: { yearsExperience: 6, skills: ['Node.js', 'Supabase'] },
      },
    };
    const { res, result } = createMockResponse();

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(200);
    const payload = JSON.parse(result.body);
    expect(payload.provider).toBe('fireworks');
    expect(payload.warning).toBeNull();
    expect(payload.proposal).toContain('deliver this project');
  });
});

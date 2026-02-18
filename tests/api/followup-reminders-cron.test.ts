import { describe, it, expect } from 'vitest';

describe('Follow-up reminders cron endpoint auth', () => {
  it('requires authorization when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
    process.env.RESEND_API_KEY = 're_test';
    process.env.MARKETING_FROM_EMAIL = 'onboarding@example.com';

    const { default: handler } = await import('../../server/api/cron/followup-reminders.js');

    const req = {
      method: 'GET',
      headers: {},
    };

    const result = { statusCode: 0, body: '' };
    const res = {
      setHeader: () => undefined,
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

    await handler(req as any, res as any);
    expect(result.statusCode).toBe(401);
    expect(result.body).toContain('Unauthorized');
  });
});

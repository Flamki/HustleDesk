import { describe, expect, it } from 'vitest';
import { __private } from '../../server/api/auth/email-config-check.js';

describe('email config check helpers', () => {
  it('extracts domain from valid email', () => {
    expect(__private.getDomainFromEmail('noreply@getsolodesk.com')).toBe('getsolodesk.com');
  });

  it('returns empty domain for invalid email', () => {
    expect(__private.getDomainFromEmail('invalid-email')).toBe('');
  });

  it('validates resend key format', () => {
    expect(__private.isLikelyResendKey('re_1234567890')).toBe(true);
    expect(__private.isLikelyResendKey('sb_secret_abc')).toBe(false);
  });

  it('marks domain verified by explicit status', () => {
    expect(__private.isDomainVerified({ status: 'verified' })).toBe(true);
    expect(__private.isDomainVerified({ status: 'not_started' })).toBe(false);
  });

  it('marks domain verified when all DNS records are verified', () => {
    expect(
      __private.isDomainVerified({
        status: '',
        records: [{ status: 'verified' }, { status: 'verified' }],
      })
    ).toBe(true);
    expect(
      __private.isDomainVerified({
        status: '',
        records: [{ status: 'verified' }, { status: 'pending' }],
      })
    ).toBe(false);
  });
});

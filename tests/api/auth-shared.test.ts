import { describe, expect, it } from 'vitest';
import { extractBearerToken, resolveAuthRedirectOrigin } from '../../server/api/_shared/auth.js';

type TestReq = { headers: Record<string, string> };

describe('Auth shared helpers', () => {
  describe('extractBearerToken', () => {
    it('extracts a valid bearer token', () => {
      const token = extractBearerToken({
        headers: { authorization: 'Bearer abc.DEF-123_~+/=' },
      } as TestReq);
      expect(token).toBe('abc.DEF-123_~+/=');
    });

    it('rejects missing bearer prefix', () => {
      const token = extractBearerToken({
        headers: { authorization: 'abc.DEF' },
      } as TestReq);
      expect(token).toBeNull();
    });

    it('rejects invalid token characters', () => {
      const token = extractBearerToken({
        headers: { authorization: 'Bearer abc<>def' },
      } as TestReq);
      expect(token).toBeNull();
    });
  });

  describe('resolveAuthRedirectOrigin', () => {
    it('prefers configured redirect origin', () => {
      const prev = process.env.VITE_AUTH_REDIRECT_ORIGIN;
      process.env.VITE_AUTH_REDIRECT_ORIGIN = 'https://getsolodesk.com';
      const origin = resolveAuthRedirectOrigin({
        headers: { host: 'ignored.example.com', 'x-forwarded-proto': 'https' },
      } as TestReq);
      expect(origin).toBe('https://getsolodesk.com');
      process.env.VITE_AUTH_REDIRECT_ORIGIN = prev;
    });

    it('falls back to request origin when env is missing', () => {
      const prevVite = process.env.VITE_AUTH_REDIRECT_ORIGIN;
      const prevApp = process.env.APP_BASE_URL;
      const prevPublic = process.env.PUBLIC_APP_URL;
      process.env.VITE_AUTH_REDIRECT_ORIGIN = '';
      process.env.APP_BASE_URL = '';
      process.env.PUBLIC_APP_URL = '';
      const origin = resolveAuthRedirectOrigin({
        headers: { host: 'getsolodesk.com', 'x-forwarded-proto': 'https' },
      } as TestReq);
      expect(origin).toBe('https://getsolodesk.com');
      process.env.VITE_AUTH_REDIRECT_ORIGIN = prevVite;
      process.env.APP_BASE_URL = prevApp;
      process.env.PUBLIC_APP_URL = prevPublic;
    });
  });
});

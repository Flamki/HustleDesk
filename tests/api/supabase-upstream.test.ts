import { describe, it, expect } from 'vitest';
import { __private } from '../../api/_shared/supabase-upstream.js';

describe('supabase upstream URL normalization', () => {
  it('keeps valid base project URL unchanged', () => {
    const value = 'https://exampleproject.supabase.co';
    expect(__private.toUsableUrl(value)).toBe(value);
  });

  it('strips /rest/v1 endpoint path to base URL', () => {
    expect(__private.toUsableUrl('https://exampleproject.supabase.co/rest/v1')).toBe(
      'https://exampleproject.supabase.co'
    );
    expect(__private.toUsableUrl('https://exampleproject.supabase.co/rest/v1/jobs')).toBe(
      'https://exampleproject.supabase.co'
    );
  });

  it('strips /auth/v1 endpoint path to base URL', () => {
    expect(__private.toUsableUrl('https://exampleproject.supabase.co/auth/v1')).toBe(
      'https://exampleproject.supabase.co'
    );
  });

  it('rejects first-party proxy loop URL as upstream candidate', () => {
    expect(__private.toUsableUrl('https://getsolodesk.com/api/sb')).toBeNull();
    expect(__private.isProxyLoopUrl('https://getsolodesk.com/api/sb')).toBe(true);
  });
});

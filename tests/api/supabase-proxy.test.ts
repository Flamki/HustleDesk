import { describe, it, expect } from 'vitest';
import { __private } from '../../api/sb/[...path].js';

describe('Supabase proxy upstream health ordering', () => {
  it('keeps original order when health data is empty', () => {
    const urls = [
      'https://alpha.supabase.co',
      'https://beta.supabase.co',
      'https://gamma.supabase.co',
    ];
    const ordered = __private.orderUpstreams(urls);
    expect(ordered).toEqual(urls);
  });

  it('de-prioritizes a recently failed upstream', () => {
    const failing = `https://failing-${Date.now()}.supabase.co`;
    const healthy = `https://healthy-${Date.now()}.supabase.co`;

    __private.markFailure(failing);
    const ordered = __private.orderUpstreams([failing, healthy]);

    expect(ordered[0]).toBe(healthy);
    expect(ordered[1]).toBe(failing);
    expect(__private.readHealth(failing).fails).toBeGreaterThan(0);
  });

  it('prioritizes the most recent successful upstream', async () => {
    const first = `https://first-${Date.now()}.supabase.co`;
    const second = `https://second-${Date.now()}.supabase.co`;

    __private.markSuccess(first);
    await new Promise((resolve) => setTimeout(resolve, 2));
    __private.markSuccess(second);
    const ordered = __private.orderUpstreams([first, second]);

    expect(ordered[0]).toBe(second);
    expect(ordered[1]).toBe(first);
  });
});

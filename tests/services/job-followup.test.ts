import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from '../../types';

const JOBS_STORAGE_KEY = 'jobs_store_v1';

vi.mock('../../services/supabaseClient', () => ({
  hasSupabase: false,
  supabase: null,
  getAuthBaseUrl: () => 'http://localhost:5173',
}));

import { updateJob } from '../../services/supabaseService';

const baseJob = (): Job => ({
  id: 'job-1',
  title: 'React project',
  platform: 'Upwork',
  description: 'Build a React app with dashboard and auth',
  currency: 'USD',
  status: 'Saved',
  createdAt: '2026-02-18T08:00:00.000Z',
});

describe('Job follow-up behavior', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('auto-sets appliedAt and followUpAt when moving to Applied', async () => {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([baseJob()]));

    const { data, error } = await updateJob('job-1', { status: 'Applied' });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.status).toBe('Applied');
    expect(data?.appliedAt).toBeTruthy();
    expect(data?.followUpAt).toBeTruthy();

    const applied = new Date(data?.appliedAt || '');
    const followup = new Date(data?.followUpAt || '');
    expect(Number.isNaN(applied.getTime())).toBe(false);
    expect(Number.isNaN(followup.getTime())).toBe(false);

    const appliedDayStart = new Date(applied.getFullYear(), applied.getMonth(), applied.getDate(), 0, 0, 0, 0).getTime();
    const followupDayStart = new Date(
      followup.getFullYear(),
      followup.getMonth(),
      followup.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    expect(Math.round((followupDayStart - appliedDayStart) / 86400000)).toBe(3);
    expect(followup.getHours()).toBe(10);
    expect(followup.getMinutes()).toBe(0);
  });

  it('preserves explicitly provided follow-up date', async () => {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([baseJob()]));

    const { data, error } = await updateJob('job-1', {
      status: 'Applied',
      followUpAt: '2026-03-01',
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    const followup = new Date(data?.followUpAt || '');
    expect(followup.getFullYear()).toBe(2026);
    expect(followup.getMonth()).toBe(2);
    expect(followup.getDate()).toBe(1);
    expect((data?.followUpAt || '')).toMatch(/T\d{2}:\d{2}:\d{2}/);
  });
});

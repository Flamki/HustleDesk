import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/ui/Toast';
import { JobsPage } from '../../pages/JobsPage';
import type { Job } from '../../types';

const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

const mockGetJobsList = vi.fn();
const mockUpdateJob = vi.fn();
const mockDeleteJob = vi.fn();

vi.mock('../../services/supabaseService', () => ({
  getJobsList: (...args: unknown[]) => mockGetJobsList(...args),
  updateJob: (...args: unknown[]) => mockUpdateJob(...args),
  deleteJob: (...args: unknown[]) => mockDeleteJob(...args),
}));

const renderJobsPage = () => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <JobsPage />
      </ToastProvider>
    </MemoryRouter>
  );
};

const baseJob = (): Job => ({
  id: 'job-1',
  title: 'Dashboard build',
  company: 'Acme',
  platform: 'Upwork',
  description: 'Build a dashboard with auth and analytics',
  currency: 'USD',
  status: 'Saved',
  createdAt: '2026-02-18T10:00:00.000Z',
});

describe('JobsPage follow-up behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders overdue follow-ups in the jobs table', async () => {
    mockGetJobsList.mockResolvedValue({
      data: {
        jobs: [{ ...baseJob(), followUpAt: '2000-01-01' }],
        total: 1,
        limit: 20,
        offset: 0,
      },
      error: null,
    });

    renderJobsPage();

    await screen.findByText('Dashboard build');
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('saves status change to Applied and updates follow-up from service response', async () => {
    const user = userEvent.setup();
    const initialJob = baseJob();

    mockGetJobsList.mockResolvedValue({
      data: { jobs: [initialJob], total: 1, limit: 20, offset: 0 },
      error: null,
    });

    mockUpdateJob.mockResolvedValue({
      data: {
        ...initialJob,
        status: 'Applied',
        appliedAt: '2026-02-18T11:00:00.000Z',
        followUpAt: '2026-02-21T15:00:00.000Z',
      },
      error: null,
    });

    renderJobsPage();
    await screen.findByText('Dashboard build');

    await user.click(screen.getByTitle('Edit'));

    const statusSelect = screen.getByDisplayValue('Saved');
    await user.selectOptions(statusSelect, 'Applied');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateJob).toHaveBeenCalledTimes(1);
    });

    const calledPayload = mockUpdateJob.mock.calls[0]?.[1];
    expect(calledPayload.status).toBe('Applied');

    await screen.findByText('Job updated successfully');

    const expectedDate = new Date('2026-02-21T15:00:00.000Z').toLocaleDateString();
    const rowTrigger = screen.getAllByText('Dashboard build').find((el) => el.closest('tr'));
    const row = rowTrigger?.closest('tr') || null;
    expect(row).not.toBeNull();
    expect(within(row as HTMLTableRowElement).getByText('Applied')).toBeInTheDocument();
    expect((row as HTMLTableRowElement).textContent || '').toContain(expectedDate);
  });
});

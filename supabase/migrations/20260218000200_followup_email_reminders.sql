-- Track follow-up reminder sends to avoid duplicate reminder emails.

alter table public.jobs
  add column if not exists followup_last_reminder_at timestamptz;

create index if not exists idx_jobs_followup_last_reminder_at
  on public.jobs(followup_last_reminder_at)
  where followup_last_reminder_at is not null;

notify pgrst, 'reload schema';

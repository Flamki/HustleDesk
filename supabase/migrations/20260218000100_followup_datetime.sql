-- Add time support for job follow-ups while keeping legacy date compatibility.

alter table public.jobs
  add column if not exists followup_at timestamptz;

-- Backfill legacy rows with a sensible reminder hour (10:00 UTC) if only date exists.
update public.jobs
set followup_at = (followup_date::timestamp + interval '10 hours')
where followup_at is null
  and followup_date is not null;

drop index if exists idx_jobs_followup_at;
create index idx_jobs_followup_at on public.jobs(followup_at);

create or replace function public.handle_job_status_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'applied' and (tg_op = 'INSERT' or old.status is distinct from 'applied') then
    if new.applied_at is null then
      new.applied_at = now();
    end if;
    if new.followup_at is null then
      new.followup_at = date_trunc('day', new.applied_at) + interval '3 days 10 hours';
    end if;
  end if;

  -- Keep legacy date column in sync for existing query paths.
  if new.followup_at is not null then
    new.followup_date = new.followup_at::date;
  end if;

  if new.status in ('won', 'lost') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if new.closed_at is null then
      new.closed_at = now();
    end if;
  end if;

  if new.status not in ('won', 'lost') then
    new.closed_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jobs_status_fields on public.jobs;
create trigger trg_jobs_status_fields
  before insert or update on public.jobs
  for each row execute procedure public.handle_job_status_fields();

alter table public.jobs
  drop constraint if exists jobs_followup_after_applied,
  add constraint jobs_followup_after_applied
  check (
    followup_at is null or
    applied_at is null or
    followup_at >= applied_at
  );

notify pgrst, 'reload schema';

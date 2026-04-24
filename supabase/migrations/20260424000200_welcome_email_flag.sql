-- Add welcome_email_sent flag to users table
alter table public.users add column if not exists welcome_email_sent boolean not null default false;

notify pgrst, 'reload schema';

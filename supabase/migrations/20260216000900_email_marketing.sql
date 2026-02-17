-- Email marketing (consent-based contacts + campaigns + send log).
-- NOTE: This is designed for compliant, opt-in email sending. Do NOT use for spam.

create extension if not exists pgcrypto;

-- Contacts owned by a user (freelancer). Contacts MUST be opt-in to receive marketing email.
create table if not exists public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  first_name text null,
  last_name text null,
  company text null,
  tags text[] not null default '{}'::text[],
  status text not null default 'subscribed', -- subscribed | unsubscribed | pending
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz null,
  unsubscribe_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_contacts_user_email_unique'
  ) then
    alter table public.marketing_contacts
      add constraint marketing_contacts_user_email_unique unique (user_id, email);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_contacts_unsubscribe_token_unique'
  ) then
    alter table public.marketing_contacts
      add constraint marketing_contacts_unsubscribe_token_unique unique (unsubscribe_token);
  end if;
end $$;

create index if not exists idx_marketing_contacts_user_id on public.marketing_contacts(user_id);
create index if not exists idx_marketing_contacts_email on public.marketing_contacts(email);
create index if not exists idx_marketing_contacts_status on public.marketing_contacts(status);
create index if not exists idx_marketing_contacts_tags on public.marketing_contacts using gin (tags);

alter table public.marketing_contacts enable row level security;

drop policy if exists "Marketing contacts SELECT own" on public.marketing_contacts;
create policy "Marketing contacts SELECT own"
  on public.marketing_contacts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Marketing contacts INSERT own" on public.marketing_contacts;
create policy "Marketing contacts INSERT own"
  on public.marketing_contacts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Marketing contacts UPDATE own" on public.marketing_contacts;
create policy "Marketing contacts UPDATE own"
  on public.marketing_contacts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Marketing contacts DELETE own" on public.marketing_contacts;
create policy "Marketing contacts DELETE own"
  on public.marketing_contacts
  for delete
  using (auth.uid() = user_id);

-- Campaigns authored by a user.
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default '',
  subject text not null,
  from_name text not null default '',
  from_email text not null default '',
  reply_to text null,
  body_text text not null default '',
  body_html text not null default '',
  status text not null default 'draft', -- draft | sending | sent | failed
  audience_tag text null, -- optional: only send to contacts having this tag
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null
);

create index if not exists idx_marketing_campaigns_user_id on public.marketing_campaigns(user_id);
create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);

alter table public.marketing_campaigns enable row level security;

drop policy if exists "Marketing campaigns SELECT own" on public.marketing_campaigns;
create policy "Marketing campaigns SELECT own"
  on public.marketing_campaigns
  for select
  using (auth.uid() = user_id);

drop policy if exists "Marketing campaigns INSERT own" on public.marketing_campaigns;
create policy "Marketing campaigns INSERT own"
  on public.marketing_campaigns
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Marketing campaigns UPDATE own" on public.marketing_campaigns;
create policy "Marketing campaigns UPDATE own"
  on public.marketing_campaigns
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Marketing campaigns DELETE own" on public.marketing_campaigns;
create policy "Marketing campaigns DELETE own"
  on public.marketing_campaigns
  for delete
  using (auth.uid() = user_id);

-- Send log per recipient.
create table if not exists public.marketing_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  contact_id uuid not null references public.marketing_contacts(id) on delete cascade,
  to_email text not null,
  status text not null default 'queued', -- queued | sent | failed | skipped
  error text null,
  provider_id text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_sends_user_id on public.marketing_sends(user_id);
create index if not exists idx_marketing_sends_campaign_id on public.marketing_sends(campaign_id);
create index if not exists idx_marketing_sends_contact_id on public.marketing_sends(contact_id);
create index if not exists idx_marketing_sends_status on public.marketing_sends(status);

alter table public.marketing_sends enable row level security;

drop policy if exists "Marketing sends SELECT own" on public.marketing_sends;
create policy "Marketing sends SELECT own"
  on public.marketing_sends
  for select
  using (auth.uid() = user_id);

drop policy if exists "Marketing sends INSERT own" on public.marketing_sends;
create policy "Marketing sends INSERT own"
  on public.marketing_sends
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Marketing sends UPDATE own" on public.marketing_sends;
create policy "Marketing sends UPDATE own"
  on public.marketing_sends
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Marketing sends DELETE own" on public.marketing_sends;
create policy "Marketing sends DELETE own"
  on public.marketing_sends
  for delete
  using (auth.uid() = user_id);

-- updated_at automation
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_contacts_updated_at on public.marketing_contacts;
create trigger trg_marketing_contacts_updated_at
before update on public.marketing_contacts
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_marketing_campaigns_updated_at on public.marketing_campaigns;
create trigger trg_marketing_campaigns_updated_at
before update on public.marketing_campaigns
for each row execute procedure public.set_updated_at();

notify pgrst, 'reload schema';


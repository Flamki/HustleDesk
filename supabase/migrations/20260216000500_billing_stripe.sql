-- Stripe billing metadata on users table
-- Safe to run multiple times.

alter table public.users
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_current_period_end timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_stripe_customer_id_unique'
  ) then
    alter table public.users
      add constraint users_stripe_customer_id_unique unique (stripe_customer_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_stripe_subscription_id_unique'
  ) then
    alter table public.users
      add constraint users_stripe_subscription_id_unique unique (stripe_subscription_id);
  end if;
end $$;

create index if not exists idx_users_stripe_customer_id on public.users (stripe_customer_id);
create index if not exists idx_users_stripe_subscription_id on public.users (stripe_subscription_id);


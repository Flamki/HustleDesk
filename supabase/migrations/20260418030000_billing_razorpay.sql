-- Razorpay billing metadata on users table
-- Safe to run multiple times.

alter table public.users
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_last_order_id text,
  add column if not exists razorpay_last_payment_id text,
  add column if not exists razorpay_last_payment_status text;

create index if not exists idx_users_razorpay_customer_id on public.users (razorpay_customer_id);
create index if not exists idx_users_razorpay_last_payment_id on public.users (razorpay_last_payment_id);

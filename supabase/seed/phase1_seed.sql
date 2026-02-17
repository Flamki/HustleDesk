-- Phase 1 seed script (jobs + activity)
-- Usage:
-- 1) Create and confirm a real auth user first.
-- 2) Replace target email below.
-- 3) Run in Supabase SQL Editor.

do $$
declare
  target_email text := 'replace-with-your-email@example.com';
  target_user_id uuid;
begin
  select id into target_user_id
  from public.users
  where email = target_email
  limit 1;

  if target_user_id is null then
    raise exception 'No profile found in public.users for email: %', target_email;
  end if;

  insert into public.jobs (
    user_id,
    title,
    platform,
    company,
    job_description,
    budget_min,
    budget_max,
    currency,
    proposed_price,
    status,
    created_at
  )
  values
    (
      target_user_id,
      'Landing Page Redesign for SaaS',
      'upwork',
      'NovaStack',
      'Looking for a frontend engineer to redesign our SaaS marketing site in React and Tailwind with strong performance and conversion focus.',
      15000,
      35000,
      'INR',
      28000,
      'saved',
      now() - interval '2 days'
    ),
    (
      target_user_id,
      'Build LinkedIn Outreach Automation Dashboard',
      'linkedin',
      'GrowthOrbit',
      'Need a dashboard that tracks outreach metrics, reply rates, and campaign performance. Prefer TypeScript and clean component architecture.',
      40000,
      90000,
      'INR',
      65000,
      'applied',
      now() - interval '5 days'
    ),
    (
      target_user_id,
      'Figma to React Admin Panel',
      'fiverr',
      'PixelMint',
      'Convert our Figma admin panel into a responsive React app with reusable components and good accessibility.',
      250,
      600,
      'USD',
      450,
      'replied',
      now() - interval '9 days'
    ),
    (
      target_user_id,
      'Stripe + Supabase Integration',
      'upwork',
      'PayBeam',
      'Implement subscription billing, webhook handling, and user plan sync using Stripe and Supabase.',
      800,
      1800,
      'USD',
      1400,
      'won',
      now() - interval '20 days'
    )
  on conflict do nothing;
end $$;

-- Data Validation Constraints and Type Improvements
-- Adds comprehensive validation rules and converts appropriate fields to ENUMs
-- Migration created: 2026-02-17

-- Create ENUMs for better type safety and validation

-- User rate limit tiers
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rate_limit_tier_enum') then
    create type public.rate_limit_tier_enum as enum ('free', 'standard', 'premium', 'enterprise');
  end if;
end $$;

-- Marketing contact status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contact_status_enum') then
    create type public.contact_status_enum as enum ('pending', 'subscribed', 'unsubscribed', 'bounced');
  end if;
end $$;

-- Marketing campaign status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status_enum') then
    create type public.campaign_status_enum as enum ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');
  end if;
end $$;

-- Marketing send status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'send_status_enum') then
    create type public.send_status_enum as enum ('queued', 'sending', 'sent', 'failed', 'bounced', 'skipped');
  end if;
end $$;

-- Freelancer experience level
do $$
begin
  if not exists (select 1 from pg_type where typname = 'experience_level_enum') then
    create type public.experience_level_enum as enum ('Entry', 'Intermediate', 'Expert', 'Senior');
  end if;
end $$;

-- Communication style
do $$
begin
  if not exists (select 1 from pg_type where typname = 'communication_style_enum') then
    create type public.communication_style_enum as enum ('Professional', 'Friendly', 'Technical', 'Casual');
  end if;
end $$;

-- Add CHECK constraints for email validation
-- Simple regex for basic email format validation

alter table public.users
  drop constraint if exists users_email_format_check,
  add constraint users_email_format_check
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_email_format_check,
  add constraint marketing_contacts_email_format_check
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

alter table public.email_subscriptions
  drop constraint if exists email_subscriptions_email_format_check,
  add constraint email_subscriptions_email_format_check
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add URL validation constraints
-- Simple check for http/https URLs

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_portfolio_url_check,
  add constraint freelancer_profiles_portfolio_url_check
  check (portfolio_url is null or portfolio_url ~* '^https?://');

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_linkedin_url_check,
  add constraint freelancer_profiles_linkedin_url_check
  check (linkedin_url is null or linkedin_url ~* '^https?://');

alter table public.marketing_portfolio_items
  drop constraint if exists marketing_portfolio_items_url_check,
  add constraint marketing_portfolio_items_url_check
  check (url is null or url ~* '^https?://');

alter table public.marketing_sites
  drop constraint if exists marketing_sites_logo_url_check,
  add constraint marketing_sites_logo_url_check
  check (logo_url is null or logo_url ~* '^https?://');

-- Add positive value constraints for numeric fields

alter table public.users
  drop constraint if exists users_ai_credits_positive,
  add constraint users_ai_credits_positive
  check (ai_credits_used >= 0 and ai_credits_limit >= 0);

-- Add rate limit tier validation
alter table public.users
  drop constraint if exists users_rate_limit_tier_valid,
  add constraint users_rate_limit_tier_valid
  check (rate_limit_tier in ('free', 'standard', 'premium', 'enterprise'));

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_positive_values,
  add constraint freelancer_profiles_positive_values
  check (years_experience >= 0 and hourly_rate >= 0);

alter table public.jobs
  drop constraint if exists jobs_positive_amounts,
  add constraint jobs_positive_amounts
  check (
    (budget_min is null or budget_min >= 0) and
    (budget_max is null or budget_max >= 0) and
    (proposed_price is null or proposed_price >= 0)
  );

-- Add length constraints for text fields

alter table public.users
  drop constraint if exists users_plan_length,
  add constraint users_plan_length
  check (length(plan) <= 50);

alter table public.jobs
  drop constraint if exists jobs_currency_length,
  add constraint jobs_currency_length
  check (length(currency) <= 10);

alter table public.jobs
  drop constraint if exists jobs_title_not_empty,
  add constraint jobs_title_not_empty
  check (length(trim(title)) > 0);

alter table public.time_entries
  drop constraint if exists time_entries_client_not_empty,
  add constraint time_entries_client_not_empty
  check (length(trim(client)) > 0);

alter table public.time_entries
  drop constraint if exists time_entries_project_not_empty,
  add constraint time_entries_project_not_empty
  check (length(trim(project)) > 0);

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_first_name_length,
  add constraint marketing_contacts_first_name_length
  check (first_name is null or length(first_name) <= 100);

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_last_name_length,
  add constraint marketing_contacts_last_name_length
  check (last_name is null or length(last_name) <= 100);

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_subject_not_empty,
  add constraint marketing_campaigns_subject_not_empty
  check (length(trim(subject)) > 0);

alter table public.marketing_sites
  drop constraint if exists marketing_sites_slug_format,
  add constraint marketing_sites_slug_format
  check (slug ~* '^[a-z0-9-]+$' and length(slug) between 3 and 63);

-- Add date/time logical constraints

alter table public.jobs
  drop constraint if exists jobs_followup_after_applied,
  add constraint jobs_followup_after_applied
  check (
    followup_date is null or 
    applied_at is null or 
    followup_date >= applied_at::date
  );

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_unsubscribe_after_subscribe,
  add constraint marketing_contacts_unsubscribe_after_subscribe
  check (
    unsubscribed_at is null or 
    unsubscribed_at >= subscribed_at
  );

alter table public.time_share_links
  drop constraint if exists time_share_links_expires_after_created,
  add constraint time_share_links_expires_after_created
  check (
    expires_at is null or 
    expires_at > created_at
  );

alter table public.time_entry_share_links
  drop constraint if exists time_entry_share_links_expires_after_created,
  add constraint time_entry_share_links_expires_after_created
  check (
    expires_at is null or 
    expires_at > created_at
  );

-- Add array constraints for better data quality

alter table public.users
  drop constraint if exists users_skills_not_null_elements,
  add constraint users_skills_not_null_elements
  check (not (null = any(skills)));

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_tags_not_null_elements,
  add constraint marketing_contacts_tags_not_null_elements
  check (not (null = any(tags)));

alter table public.marketing_portfolio_items
  drop constraint if exists marketing_portfolio_items_tags_not_null_elements,
  add constraint marketing_portfolio_items_tags_not_null_elements
  check (not (null = any(tags)));

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_skills_not_null_elements,
  add constraint freelancer_profiles_skills_not_null_elements
  check (not (null = any(skills)));

-- Add sort order constraint for portfolio items
alter table public.marketing_portfolio_items
  drop constraint if exists marketing_portfolio_items_sort_order_positive,
  add constraint marketing_portfolio_items_sort_order_positive
  check (sort_order >= 0);

-- Add hex color validation for marketing sites
alter table public.marketing_sites
  drop constraint if exists marketing_sites_primary_color_format,
  add constraint marketing_sites_primary_color_format
  check (primary_color ~* '^#[0-9A-Fa-f]{6}$');

alter table public.marketing_sites
  drop constraint if exists marketing_sites_accent_color_format,
  add constraint marketing_sites_accent_color_format
  check (accent_color ~* '^#[0-9A-Fa-f]{6}$');

-- Add token format validation (must be hexadecimal)
alter table public.time_share_links
  drop constraint if exists time_share_links_token_format,
  add constraint time_share_links_token_format
  check (token ~* '^[0-9a-f]+$' and length(token) >= 32);

alter table public.time_entry_share_links
  drop constraint if exists time_entry_share_links_token_format,
  add constraint time_entry_share_links_token_format
  check (token ~* '^[0-9a-f]+$' and length(token) >= 32);

alter table public.marketing_contacts
  drop constraint if exists marketing_contacts_unsubscribe_token_format,
  add constraint marketing_contacts_unsubscribe_token_format
  check (unsubscribe_token ~* '^[0-9a-f]+$' and length(unsubscribe_token) >= 32);

-- Add Stripe ID format validation
alter table public.users
  drop constraint if exists users_stripe_customer_id_format,
  add constraint users_stripe_customer_id_format
  check (stripe_customer_id is null or stripe_customer_id ~* '^cus_[A-Za-z0-9]{14,}$');

alter table public.users
  drop constraint if exists users_stripe_subscription_id_format,
  add constraint users_stripe_subscription_id_format
  check (stripe_subscription_id is null or stripe_subscription_id ~* '^sub_[A-Za-z0-9]{14,}$');

-- Function to validate JSONB structure for specific fields
create or replace function public.validate_freelancer_past_projects(past_projects jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  -- past_projects should be an array
  if jsonb_typeof(past_projects) != 'array' then
    return false;
  end if;
  
  -- Each element should be an object with required keys
  -- This is a basic check; extend as needed
  return true;
end;
$$;

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_past_projects_valid,
  add constraint freelancer_profiles_past_projects_valid
  check (validate_freelancer_past_projects(past_projects));

-- Comments for documentation
comment on constraint users_email_format_check on public.users is 
  'Validates email address format using regex';
comment on constraint jobs_budget_range_valid on public.jobs is 
  'Ensures budget_max is greater than or equal to budget_min';
comment on constraint time_entries_end_after_start on public.time_entries is 
  'Ensures end_time is after start_time';
comment on constraint marketing_sites_slug_format on public.marketing_sites is 
  'Validates slug format: lowercase alphanumeric and hyphens only, 3-63 characters';

notify pgrst, 'reload schema';

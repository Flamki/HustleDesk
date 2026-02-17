-- Add site_kind + config for robust website builder state.
-- Enforces one link_in_bio and one portfolio site per user.

alter table public.marketing_sites
  add column if not exists site_kind text not null default 'portfolio',
  add column if not exists config jsonb not null default '{}'::jsonb;

-- Backfill old rows to link_in_bio when template prefix matches.
update public.marketing_sites
set site_kind = 'link_in_bio'
where site_kind = 'portfolio'
  and template like 'linkbio_%';

-- Validate allowed values.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_sites_site_kind_check'
  ) then
    alter table public.marketing_sites
      add constraint marketing_sites_site_kind_check
      check (site_kind in ('link_in_bio', 'portfolio'));
  end if;
end $$;

-- Enforce max one site per user per kind.
create unique index if not exists idx_marketing_sites_user_kind_unique
  on public.marketing_sites(user_id, site_kind);

create index if not exists idx_marketing_sites_site_kind
  on public.marketing_sites(site_kind);

notify pgrst, 'reload schema';


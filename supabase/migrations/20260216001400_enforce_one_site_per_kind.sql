-- Enforce: one site per user per kind (link_in_bio, portfolio), safely.
-- This migration is idempotent and deduplicates existing rows before unique index.

begin;

alter table public.marketing_sites
  add column if not exists site_kind text not null default 'portfolio',
  add column if not exists config jsonb not null default '{}'::jsonb;

update public.marketing_sites
set site_kind = 'link_in_bio'
where template like 'linkbio_%';

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, site_kind
      order by
        (published_at is not null) desc,
        coalesce(updated_at, created_at) desc,
        created_at desc,
        id desc
    ) as rn
  from public.marketing_sites
),
to_delete as (
  select id
  from ranked
  where rn > 1
)
delete from public.marketing_sites ms
using to_delete d
where ms.id = d.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_sites_site_kind_check'
  ) then
    alter table public.marketing_sites
      add constraint marketing_sites_site_kind_check
      check (site_kind in ('link_in_bio', 'portfolio'));
  end if;
end $$;

create unique index if not exists idx_marketing_sites_user_kind_unique
  on public.marketing_sites(user_id, site_kind);

create index if not exists idx_marketing_sites_site_kind
  on public.marketing_sites(site_kind);

notify pgrst, 'reload schema';

commit;


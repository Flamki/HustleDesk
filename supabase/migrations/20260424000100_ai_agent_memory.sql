-- Per-User AI Agent Memory System
-- Each user gets a dedicated agent that learns from their data over time.

-- ══════════════════════════════════════════════════════════════
-- 1. Agent Memory — cumulative learning per user
-- ══════════════════════════════════════════════════════════════

create table if not exists public.agent_memory (
  user_id uuid primary key references public.users(id) on delete cascade,

  -- Win/Loss pattern memory
  total_proposals_generated integer not null default 0,
  total_wins integer not null default 0,
  total_losses integer not null default 0,
  current_win_rate numeric(5,4) not null default 0,
  current_streak integer not null default 0,          -- positive=win streak, negative=loss streak
  best_win_streak integer not null default 0,

  -- Platform performance memory
  platform_stats jsonb not null default '{}'::jsonb,   -- { "upwork": { wins: 5, losses: 2, avg_price: 500 }, ... }

  -- Pricing memory
  avg_winning_price numeric(12,2) not null default 0,
  avg_losing_price numeric(12,2) not null default 0,
  optimal_price_range jsonb not null default '{"min": 0, "max": 0}'::jsonb,

  -- Skill match memory
  winning_skills jsonb not null default '[]'::jsonb,    -- skills most correlated with wins
  losing_patterns jsonb not null default '[]'::jsonb,   -- common patterns in lost jobs

  -- Tone/style memory
  best_performing_tone text not null default 'professional',
  best_performing_length text not null default 'standard',
  tone_stats jsonb not null default '{}'::jsonb,        -- { "professional": { wins: 3, losses: 1 }, ... }

  -- Agent strategy evolution
  learned_insights jsonb not null default '[]'::jsonb,  -- accumulated AI-generated insights
  strategy_version integer not null default 1,          -- increments as agent learns

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_memory enable row level security;

drop policy if exists "Agent memory SELECT own" on public.agent_memory;
create policy "Agent memory SELECT own"
  on public.agent_memory
  for select
  using (auth.uid() = user_id);

drop policy if exists "Agent memory INSERT own" on public.agent_memory;
create policy "Agent memory INSERT own"
  on public.agent_memory
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Agent memory UPDATE own" on public.agent_memory;
create policy "Agent memory UPDATE own"
  on public.agent_memory
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_agent_memory_user_id on public.agent_memory (user_id);


-- ══════════════════════════════════════════════════════════════
-- 2. Agent Interactions — conversation audit trail
-- ══════════════════════════════════════════════════════════════

create table if not exists public.agent_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  interaction_type text not null default 'chat',   -- 'chat', 'proposal', 'learning', 'insight'
  context jsonb not null default '{}'::jsonb,      -- { jobId, stepId, etc. }
  user_message text,
  agent_response text,
  profile_patch jsonb,                             -- what was changed
  outcome text,                                    -- 'win', 'loss', 'pending', null
  job_id uuid,                                     -- optional reference to related job
  confidence_score numeric(4,3),                   -- agent's confidence in its advice
  created_at timestamptz not null default now()
);

alter table public.agent_interactions enable row level security;

drop policy if exists "Agent interactions SELECT own" on public.agent_interactions;
create policy "Agent interactions SELECT own"
  on public.agent_interactions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Agent interactions INSERT own" on public.agent_interactions;
create policy "Agent interactions INSERT own"
  on public.agent_interactions
  for insert
  with check (auth.uid() = user_id);

create index if not exists idx_agent_interactions_user_id on public.agent_interactions (user_id);
create index if not exists idx_agent_interactions_job_id on public.agent_interactions (job_id);
create index if not exists idx_agent_interactions_created on public.agent_interactions (created_at desc);
create index if not exists idx_agent_interactions_type on public.agent_interactions (interaction_type);


-- ══════════════════════════════════════════════════════════════
-- 3. Auto-create agent memory row for new users
-- ══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agent_memory (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_user_created_agent on public.users;
create trigger on_user_created_agent
  after insert on public.users
  for each row execute procedure public.handle_new_user_agent();

notify pgrst, 'reload schema';

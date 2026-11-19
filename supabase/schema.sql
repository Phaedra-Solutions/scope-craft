-- =============================================================================
-- ScopeCraft — Optimized Supabase (PostgreSQL) Schema for Lead Capture
-- Designed for 100% form-state coverage, high concurrency, & minimal storage.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Leads (Deduplicated Prospect & Consent Record)
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  company text not null,
  job_role text not null,
  budget_range text not null,
  marketing_consent boolean not null default false,
  privacy_accepted boolean not null default false,
  wants_paid_architect_review boolean not null default false,
  tags text[] not null default array['scopecraft-estimator-lead', 'complimentary-scope', 'website-inbound']::text[],
  ghl_synced boolean not null default false,
  ghl_last_synced_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique case-insensitive email enables race-free ON CONFLICT upserts
create unique index if not exists idx_leads_email_unique on public.leads (lower(email));
create index if not exists idx_leads_created_at on public.leads (created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Lead Estimates (Deduplicated Scope, Currency, Team & Cost Snapshot)
-- -----------------------------------------------------------------------------
create table if not exists public.lead_estimates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,

  -- Deterministic SHA-256 hash of (scope + team + region + currency)
  -- Prevents duplicate estimate rows when user exports PDF/HTML/Print repeatedly
  scope_hash text not null,

  -- Step 1 & Header: Foundations & Presets
  project_name text not null,
  client_name text not null,
  source_preset_id text,
  platforms text[] not null default '{}'::text[],
  complexity text not null check (complexity in ('mvp', 'standard', 'enterprise')),
  design_level text not null check (design_level in ('wireframe', 'standard_ui', 'custom_bespoke')),
  qa_level text not null check (qa_level in ('basic', 'standard', 'automated_security')),
  maintenance_period text not null check (maintenance_period in ('none', '3_months', '6_months', '12_months')),
  engagement_model text not null default 'dedicated_team'
    check (engagement_model in ('dedicated_team', 'time_and_materials', 'fixed_price')),
  target_timeline_weeks integer not null,

  -- Step 2 & Post-Unlock: Selected Modules, SaaS Add-ons & Custom Items
  -- Stored as compact JSONB to avoid write amplification across child tables
  selected_features jsonb not null default '[]'::jsonb,
  saas_addons jsonb not null default '[]'::jsonb,
  custom_params jsonb not null default '[]'::jsonb,

  -- Step 3 & Margins: Region Benchmark, Engineering Squad & Risk Buffers
  region_id text not null,
  region_name text not null,
  region_rate_multiplier numeric(5, 2) not null default 0.30,
  team_roles jsonb not null default '[]'::jsonb,
  contingency_buffer_percent numeric(5, 2) not null default 15.00,
  profit_margin_percent numeric(5, 2) not null default 10.00,

  -- Active Display Currency at Submission
  currency_code text not null default 'USD'
    check (currency_code in ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR')),
  currency_symbol text not null default '$',
  exchange_rate numeric(10, 4) not null default 1.0000,

  -- Calculated Effort & Timeline
  total_hours integer not null,
  estimated_timeline_months numeric(6, 2) not null,
  estimated_timeline_weeks integer not null,
  velocity_status text not null check (velocity_status in ('understaffed', 'balanced', 'accelerated')),
  team_total_monthly_capacity_hours numeric(10, 2) not null,

  -- Financial Totals (Base USD + Display Currency Total)
  base_labor_cost_usd numeric(12, 2) not null,
  contingency_amount_usd numeric(12, 2) not null,
  profit_margin_amount_usd numeric(12, 2) not null,
  maintenance_cost_usd numeric(12, 2) not null,
  custom_params_cost_usd numeric(12, 2) not null default 0,
  monthly_saas_cost_usd numeric(12, 2) not null default 0,
  grand_total_cost_usd numeric(12, 2) not null,
  display_grand_total numeric(14, 2) not null,
  effective_hourly_rate_usd numeric(10, 2) not null,
  team_monthly_burn_rate_usd numeric(12, 2) not null,

  -- Calculated Breakdowns
  cost_by_role_category jsonb not null default '{}'::jsonb,
  hours_by_role_category jsonb not null default '{}'::jsonb,
  phase_breakdown jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),

  constraint uq_lead_estimates_lead_scope_hash unique (lead_id, scope_hash)
);

create index if not exists idx_lead_estimates_lead_id on public.lead_estimates (lead_id);
create index if not exists idx_lead_estimates_created_at on public.lead_estimates (created_at desc);

-- -----------------------------------------------------------------------------
-- 3. Lead Activity & Export Events (Lightweight Audit Log)
-- -----------------------------------------------------------------------------
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  estimate_id uuid references public.lead_estimates (id) on delete set null,
  event_type text not null check (event_type in ('lead_created', 'scope_updated')),
  trigger_action text not null,
  ghl_forwarded boolean not null default false,
  ghl_status_code integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_lead_id on public.lead_events (lead_id);
create index if not exists idx_lead_events_created_at on public.lead_events (created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Automatic updated_at Trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Single-Round-Trip Atomic RPC for High-Concurrency Lead Submissions
-- Upserts lead, inserts estimate only if scope_hash is new, and logs event.
-- -----------------------------------------------------------------------------
create or replace function public.save_lead_submission(p_payload jsonb)
returns table (
  lead_id uuid,
  estimate_id uuid,
  event_id uuid,
  is_new_estimate boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_estimate_id uuid;
  v_event_id uuid;
  v_is_new_estimate boolean := false;
  v_lead jsonb := coalesce(p_payload->'lead', '{}'::jsonb);
  v_est jsonb := coalesce(p_payload->'estimate', '{}'::jsonb);
  v_evt jsonb := coalesce(p_payload->'event', '{}'::jsonb);
begin
  -- 1. Atomic Lead Upsert by lowercase email
  insert into public.leads (
    full_name,
    email,
    phone,
    company,
    job_role,
    budget_range,
    marketing_consent,
    privacy_accepted,
    wants_paid_architect_review,
    tags,
    ghl_synced,
    ghl_last_synced_at,
    submitted_at
  )
  values (
    v_lead->>'full_name',
    lower(trim(v_lead->>'email')),
    coalesce(v_lead->>'phone', ''),
    coalesce(v_lead->>'company', ''),
    coalesce(v_lead->>'job_role', ''),
    coalesce(v_lead->>'budget_range', ''),
    coalesce((v_lead->>'marketing_consent')::boolean, false),
    coalesce((v_lead->>'privacy_accepted')::boolean, false),
    coalesce((v_lead->>'wants_paid_architect_review')::boolean, false),
    coalesce(
      array(select jsonb_array_elements_text(v_lead->'tags')),
      array['scopecraft-estimator-lead', 'complimentary-scope', 'website-inbound']::text[]
    ),
    coalesce((v_lead->>'ghl_synced')::boolean, false),
    case when coalesce((v_lead->>'ghl_synced')::boolean, false) then now() else null end,
    coalesce((v_lead->>'submitted_at')::timestamptz, now())
  )
  on conflict ((lower(email))) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    company = excluded.company,
    job_role = excluded.job_role,
    budget_range = excluded.budget_range,
    marketing_consent = excluded.marketing_consent,
    privacy_accepted = excluded.privacy_accepted,
    wants_paid_architect_review = public.leads.wants_paid_architect_review or excluded.wants_paid_architect_review,
    tags = array(select distinct unnest(public.leads.tags || excluded.tags)),
    ghl_synced = public.leads.ghl_synced or excluded.ghl_synced,
    ghl_last_synced_at = coalesce(excluded.ghl_last_synced_at, public.leads.ghl_last_synced_at)
  returning id into v_lead_id;

  -- 2. Deduplicated Estimate Insert (skips duplicate writes on repeat exports)
  insert into public.lead_estimates (
    lead_id,
    scope_hash,
    project_name,
    client_name,
    source_preset_id,
    platforms,
    complexity,
    design_level,
    qa_level,
    maintenance_period,
    engagement_model,
    target_timeline_weeks,
    selected_features,
    saas_addons,
    custom_params,
    region_id,
    region_name,
    region_rate_multiplier,
    team_roles,
    contingency_buffer_percent,
    profit_margin_percent,
    currency_code,
    currency_symbol,
    exchange_rate,
    total_hours,
    estimated_timeline_months,
    estimated_timeline_weeks,
    velocity_status,
    team_total_monthly_capacity_hours,
    base_labor_cost_usd,
    contingency_amount_usd,
    profit_margin_amount_usd,
    maintenance_cost_usd,
    custom_params_cost_usd,
    monthly_saas_cost_usd,
    grand_total_cost_usd,
    display_grand_total,
    effective_hourly_rate_usd,
    team_monthly_burn_rate_usd,
    cost_by_role_category,
    hours_by_role_category,
    phase_breakdown
  )
  values (
    v_lead_id,
    v_est->>'scope_hash',
    coalesce(v_est->>'project_name', 'Software Development Project'),
    coalesce(v_est->>'client_name', ''),
    v_est->>'source_preset_id',
    coalesce(array(select jsonb_array_elements_text(v_est->'platforms')), '{}'::text[]),
    coalesce(v_est->>'complexity', 'standard'),
    coalesce(v_est->>'design_level', 'standard_ui'),
    coalesce(v_est->>'qa_level', 'standard'),
    coalesce(v_est->>'maintenance_period', '3_months'),
    coalesce(v_est->>'engagement_model', 'dedicated_team'),
    coalesce((v_est->>'target_timeline_weeks')::integer, 12),
    coalesce(v_est->'selected_features', '[]'::jsonb),
    coalesce(v_est->'saas_addons', '[]'::jsonb),
    coalesce(v_est->'custom_params', '[]'::jsonb),
    coalesce(v_est->>'region_id', 'phaedra'),
    coalesce(v_est->>'region_name', 'ScopeCraft Squad (default)'),
    coalesce((v_est->>'region_rate_multiplier')::numeric, 0.30),
    coalesce(v_est->'team_roles', '[]'::jsonb),
    coalesce((v_est->>'contingency_buffer_percent')::numeric, 15.00),
    coalesce((v_est->>'profit_margin_percent')::numeric, 10.00),
    coalesce(v_est->>'currency_code', 'USD'),
    coalesce(v_est->>'currency_symbol', '$'),
    coalesce((v_est->>'exchange_rate')::numeric, 1.0000),
    coalesce((v_est->>'total_hours')::integer, 0),
    coalesce((v_est->>'estimated_timeline_months')::numeric, 0),
    coalesce((v_est->>'estimated_timeline_weeks')::integer, 0),
    coalesce(v_est->>'velocity_status', 'balanced'),
    coalesce((v_est->>'team_total_monthly_capacity_hours')::numeric, 0),
    coalesce((v_est->>'base_labor_cost_usd')::numeric, 0),
    coalesce((v_est->>'contingency_amount_usd')::numeric, 0),
    coalesce((v_est->>'profit_margin_amount_usd')::numeric, 0),
    coalesce((v_est->>'maintenance_cost_usd')::numeric, 0),
    coalesce((v_est->>'custom_params_cost_usd')::numeric, 0),
    coalesce((v_est->>'monthly_saas_cost_usd')::numeric, 0),
    coalesce((v_est->>'grand_total_cost_usd')::numeric, 0),
    coalesce((v_est->>'display_grand_total')::numeric, 0),
    coalesce((v_est->>'effective_hourly_rate_usd')::numeric, 0),
    coalesce((v_est->>'team_monthly_burn_rate_usd')::numeric, 0),
    coalesce(v_est->'cost_by_role_category', '{}'::jsonb),
    coalesce(v_est->'hours_by_role_category', '{}'::jsonb),
    coalesce(v_est->'phase_breakdown', '[]'::jsonb)
  )
  on conflict on constraint uq_lead_estimates_lead_scope_hash do nothing
  returning id into v_estimate_id;

  if v_estimate_id is not null then
    v_is_new_estimate := true;
  else
    select id into v_estimate_id
    from public.lead_estimates
    where lead_id = v_lead_id and scope_hash = (v_est->>'scope_hash');
  end if;

  -- 3. Append lightweight audit event
  insert into public.lead_events (
    lead_id,
    estimate_id,
    event_type,
    trigger_action,
    ghl_forwarded,
    ghl_status_code
  )
  values (
    v_lead_id,
    v_estimate_id,
    coalesce(v_evt->>'event_type', 'lead_created'),
    coalesce(v_evt->>'trigger_action', 'guided_wizard_reveal'),
    coalesce((v_evt->>'ghl_forwarded')::boolean, false),
    (v_evt->>'ghl_status_code')::integer
  )
  returning id into v_event_id;

  return query select v_lead_id, v_estimate_id, v_event_id, v_is_new_estimate;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- Server-side /api/leads uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Public anon key has zero access to prospect PII or RPC execution.
-- -----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.lead_estimates enable row level security;
alter table public.lead_events enable row level security;

revoke all on function public.save_lead_submission(jsonb) from public, anon, authenticated;
grant execute on function public.save_lead_submission(jsonb) to service_role;

create table if not exists public.training_session_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  trainer_id uuid not null references public.staff_members(id) on delete restrict,
  title text not null,
  session_kind text not null check (
    session_kind in ('personal_training', 'yoga', 'swimming_lesson', 'boxing', 'pilates', 'rehab', 'other')
  ),
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'completed', 'cancelled')),
  payment_status text not null default 'external_pending' check (
    payment_status in ('unpaid', 'partial', 'paid', 'refunded', 'external_pending')
  ),
  payment_amount integer not null default 0 check (payment_amount >= 0),
  payment_currency text not null default 'TRY',
  external_payment_reference text not null default '',
  total_sessions integer not null check (total_sessions > 0),
  default_duration_min integer not null default 60 check (default_duration_min > 0),
  starts_on date,
  ends_on date,
  details text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.training_session_occurrences (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_session_plans(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')
  ),
  location_name text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, sequence_number),
  check (ends_at > starts_at)
);

create index if not exists training_session_plans_org_status_idx
on public.training_session_plans(organization_id, status);

create index if not exists training_session_plans_trainer_status_idx
on public.training_session_plans(trainer_id, status);

create index if not exists training_session_plans_customer_status_idx
on public.training_session_plans(customer_id, status);

create index if not exists training_session_occurrences_range_idx
on public.training_session_occurrences(starts_at, ends_at);

create index if not exists training_session_occurrences_status_starts_idx
on public.training_session_occurrences(status, starts_at);

alter table public.training_session_plans enable row level security;
alter table public.training_session_occurrences enable row level security;

create policy "members can read own training session plans"
on public.training_session_plans for select
to authenticated
using (
  customer_id in (
    select c.id
    from public.customers c
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
  )
);

create policy "staff can read organization training session plans"
on public.training_session_plans for select
to authenticated
using (
  organization_id in (
    select sm.organization_id
    from public.staff_members sm
    join public.profiles p on p.id = sm.profile_id
    where p.supabase_user_id = auth.uid()
      and sm.is_active = true
      and sm.employment_status = 'active'
  )
);

create policy "members can read own training session occurrences"
on public.training_session_occurrences for select
to authenticated
using (
  plan_id in (
    select tsp.id
    from public.training_session_plans tsp
    join public.customers c on c.id = tsp.customer_id
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
  )
);

create policy "staff can read organization training session occurrences"
on public.training_session_occurrences for select
to authenticated
using (
  plan_id in (
    select tsp.id
    from public.training_session_plans tsp
    join public.staff_members sm on sm.organization_id = tsp.organization_id
    join public.profiles p on p.id = sm.profile_id
    where p.supabase_user_id = auth.uid()
      and sm.is_active = true
      and sm.employment_status = 'active'
  )
);

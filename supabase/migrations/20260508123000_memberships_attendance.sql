create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  product_kind text not null check (product_kind in ('membership', 'credit_pack', 'day_pass')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual', 'session_pack', 'one_time')),
  access_rule text not null default 'unlimited' check (access_rule in ('unlimited', 'limited_visits', 'classes_only', 'appointments_only')),
  visit_limit_per_period integer,
  session_credit_amount integer not null default 0,
  price_amount integer not null default 0,
  price_currency text not null default 'TRY',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_membership_plan_name_per_org unique (organization_id, name)
);

alter table public.memberships
add column if not exists plan_id uuid references public.membership_plans(id) on delete set null,
add column if not exists status text not null default 'active' check (status in ('trial', 'active', 'frozen', 'cancelled', 'expired')),
add column if not exists auto_renew boolean not null default false,
add column if not exists frozen_at timestamptz,
add column if not exists cancelled_at timestamptz,
add column if not exists cancellation_reason text not null default '';

create table if not exists public.member_check_ins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  membership_id uuid references public.memberships(id) on delete set null,
  method text not null default 'membership_code' check (method in ('qr', 'membership_code', 'manual', 'kiosk')),
  source text not null default 'front_desk' check (source in ('front_desk', 'member_app', 'kiosk', 'import')),
  checked_in_at timestamptz not null default now(),
  handled_by_id uuid references public.staff_members(id) on delete set null,
  notes text not null default '',
  is_voided boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists membership_plans_org_active_idx
on public.membership_plans(organization_id, is_active);

create index if not exists memberships_customer_status_idx
on public.memberships(customer_id, status);

create index if not exists memberships_valid_to_status_idx
on public.memberships(valid_to, status);

create index if not exists member_check_ins_org_checked_in_idx
on public.member_check_ins(organization_id, checked_in_at);

create index if not exists member_check_ins_customer_checked_in_idx
on public.member_check_ins(customer_id, checked_in_at);

create index if not exists member_check_ins_handled_by_checked_in_idx
on public.member_check_ins(handled_by_id, checked_in_at);

alter table public.membership_plans enable row level security;
alter table public.member_check_ins enable row level security;

create policy "staff can read organization membership plans"
on public.membership_plans for select
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

create policy "members can read own membership plans"
on public.membership_plans for select
to authenticated
using (
  id in (
    select m.plan_id
    from public.memberships m
    join public.customers c on c.id = m.customer_id
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
      and m.is_active = true
  )
);

create policy "staff can read organization member check-ins"
on public.member_check_ins for select
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

create policy "members can read own member check-ins"
on public.member_check_ins for select
to authenticated
using (
  customer_id in (
    select c.id
    from public.customers c
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
  )
);

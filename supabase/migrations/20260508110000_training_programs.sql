create table if not exists public.training_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  summary text not null default '',
  goal text not null default '',
  difficulty text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by_id uuid references public.staff_members(id) on delete set null,
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_program_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.training_programs(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  assigned_by_id uuid references public.staff_members(id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned', 'active', 'completed', 'cancelled')),
  starts_on date,
  ends_on date,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists training_programs_org_status_idx
on public.training_programs(organization_id, status);

create index if not exists training_programs_org_active_idx
on public.training_programs(organization_id, is_active);

create index if not exists training_program_assignments_org_status_idx
on public.training_program_assignments(organization_id, status);

create index if not exists training_program_assignments_customer_status_idx
on public.training_program_assignments(customer_id, status);

create index if not exists training_program_assignments_assigned_by_status_idx
on public.training_program_assignments(assigned_by_id, status);

alter table public.training_programs enable row level security;
alter table public.training_program_assignments enable row level security;

create policy "staff can read organization training programs"
on public.training_programs for select
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

create policy "members can read assigned training programs"
on public.training_programs for select
to authenticated
using (
  id in (
    select tpa.program_id
    from public.training_program_assignments tpa
    join public.customers c on c.id = tpa.customer_id
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
      and tpa.is_active = true
  )
);

create policy "staff can read organization program assignments"
on public.training_program_assignments for select
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

create policy "members can read own program assignments"
on public.training_program_assignments for select
to authenticated
using (
  customer_id in (
    select c.id
    from public.customers c
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
  )
);

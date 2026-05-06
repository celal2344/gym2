alter table public.training_session_plans
  add column if not exists amount_paid integer not null default 0 check (amount_paid >= 0),
  add column if not exists payment_provider text not null default '',
  add column if not exists paid_at timestamptz,
  add column if not exists payment_notes text not null default '';

alter table public.training_session_plans
  drop constraint if exists training_session_plans_amount_paid_lte_amount;

alter table public.training_session_plans
  add constraint training_session_plans_amount_paid_lte_amount
  check (amount_paid <= payment_amount);

create index if not exists training_session_occurrences_plan_starts_idx
on public.training_session_occurrences(plan_id, starts_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_staff_member_id uuid references public.staff_members(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_logs_org_created_idx
on public.audit_logs(organization_id, created_at);

create index if not exists audit_logs_target_idx
on public.audit_logs(target_type, target_id);

alter table public.audit_logs enable row level security;

create policy "staff can read organization audit logs"
on public.audit_logs for select
to authenticated
using (
  organization_id in (
    select sm.organization_id
    from public.staff_members sm
    join public.profiles p on p.id = sm.profile_id
    where p.supabase_user_id = auth.uid()
      and sm.is_active = true
      and sm.employment_status = 'active'
      and sm.role_kind in ('admin', 'manager')
  )
);

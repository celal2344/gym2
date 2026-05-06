alter table public.customers
  add column if not exists notes text not null default '',
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz;

alter table public.staff_members
  add column if not exists job_title text not null default '',
  add column if not exists employment_status text not null default 'active',
  add column if not exists starts_on date,
  add column if not exists emergency_contact_name text not null default '',
  add column if not exists emergency_contact_phone text not null default '',
  add column if not exists notes text not null default '',
  add column if not exists deactivated_at timestamptz;

alter table public.staff_members
  drop constraint if exists staff_members_role_kind_check;

alter table public.staff_members
  add constraint staff_members_role_kind_check
  check (role_kind in ('admin', 'manager', 'personal_trainer', 'front_desk', 'therapist'));

alter table public.staff_members
  drop constraint if exists staff_members_employment_status_check;

alter table public.staff_members
  add constraint staff_members_employment_status_check
  check (employment_status in ('active', 'on_leave', 'terminated'));

create index if not exists staff_members_org_role_active_idx
on public.staff_members(organization_id, role_kind, is_active);

create index if not exists customers_org_active_idx
on public.customers(organization_id, is_active);

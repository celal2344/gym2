create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  timezone text not null default 'Europe/Istanbul',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  membership_code text not null,
  status text not null default 'active' check (status in ('active', 'guest', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, membership_code)
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  role_kind text not null check (role_kind in ('admin', 'front_desk', 'trainer', 'therapist')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  resource_kind text not null check (resource_kind in ('pool_lane', 'room', 'entry_gate')),
  capacity integer not null default 1 check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  service_kind text not null check (service_kind in ('pool', 'personal_training', 'massage', 'day_pass')),
  duration_min integer not null check (duration_min > 0),
  slot_interval_min integer not null default 60 check (slot_interval_min > 0),
  capacity_mode text not null check (capacity_mode in ('shared_capacity', 'staff_exclusive', 'staff_and_resource', 'entitlement')),
  requires_staff boolean not null default false,
  requires_resource boolean not null default false,
  price_amount integer not null default 0 check (price_amount >= 0),
  price_currency text not null default 'TRY',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slot_inventory (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  staff_member_id uuid references public.staff_members(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity_total integer not null default 1 check (capacity_total > 0),
  capacity_reserved integer not null default 0 check (capacity_reserved >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (capacity_reserved <= capacity_total),
  check (ends_at > starts_at)
);

create index if not exists slot_inventory_service_starts_idx on public.slot_inventory(service_id, starts_at);
create index if not exists slot_inventory_staff_starts_idx on public.slot_inventory(staff_member_id, starts_at);
create index if not exists slot_inventory_resource_starts_idx on public.slot_inventory(resource_id, starts_at);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  slot_id uuid not null references public.slot_inventory(id) on delete restrict,
  status text not null default 'reserved' check (status in ('reserved', 'checked_in', 'cancelled', 'no_show')),
  channel text not null default 'web' check (channel in ('web', 'mobile', 'front_desk')),
  attendee_count integer not null default 1 check (attendee_count > 0),
  qr_token uuid not null unique default gen_random_uuid(),
  external_payment_reference text not null default '',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  method text not null check (method in ('qr', 'membership_code', 'manual')),
  handled_by_id uuid references public.staff_members(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_kind text not null check (product_kind in ('membership', 'credit_pack', 'day_pass')),
  valid_from date not null,
  valid_to date,
  remaining_credits integer not null default 0 check (remaining_credits >= 0),
  external_payment_reference text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  kind text not null check (kind in ('receipt', 'waiver', 'avatar', 'evidence')),
  owner_customer_id uuid references public.customers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.staff_members enable row level security;
alter table public.resources enable row level security;
alter table public.services enable row level security;
alter table public.slot_inventory enable row level security;
alter table public.bookings enable row level security;
alter table public.check_ins enable row level security;
alter table public.memberships enable row level security;
alter table public.attachments enable row level security;

create policy "authenticated can read published services"
on public.services for select
to authenticated
using (is_active = true);

create policy "authenticated can read open slots"
on public.slot_inventory for select
to authenticated
using (is_published = true and starts_at > now());

create policy "members can read own profile"
on public.profiles for select
to authenticated
using (supabase_user_id = auth.uid());

create policy "members can read own customer record"
on public.customers for select
to authenticated
using (profile_id in (select id from public.profiles where supabase_user_id = auth.uid()));

create policy "members can read own bookings"
on public.bookings for select
to authenticated
using (
  customer_id in (
    select c.id
    from public.customers c
    join public.profiles p on p.id = c.profile_id
    where p.supabase_user_id = auth.uid()
  )
);

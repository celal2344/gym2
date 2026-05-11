create extension if not exists "pgcrypto" with schema extensions;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@gymops.dev',
    extensions.crypt('GymOpsAdmin123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'manager@gymops.dev',
    extensions.crypt('GymOpsManager123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Manager User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'trainer@gymops.dev',
    extensions.crypt('GymOpsTrainer123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Trainer User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member@gymops.dev',
    extensions.crypt('GymOpsMember123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Member User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from auth.users
where email in ('admin@gymops.dev', 'manager@gymops.dev', 'trainer@gymops.dev', 'member@gymops.dev')
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.organizations (id, name, slug)
values ('20000000-0000-4000-8000-000000000001', 'Fit Club', 'fit-club')
on conflict (slug) do update set name = excluded.name, updated_at = now();

insert into public.profiles (supabase_user_id, full_name, phone, email)
values
  ('10000000-0000-4000-8000-000000000001', 'Admin User', '+905550000001', 'admin@gymops.dev'),
  ('10000000-0000-4000-8000-000000000002', 'Manager User', '+905550000002', 'manager@gymops.dev'),
  ('10000000-0000-4000-8000-000000000003', 'Trainer User', '+905550000003', 'trainer@gymops.dev'),
  ('10000000-0000-4000-8000-000000000004', 'Member User', '+905550000004', 'member@gymops.dev')
on conflict (supabase_user_id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  updated_at = now();

insert into public.staff_members (
  organization_id,
  profile_id,
  display_name,
  role_kind,
  job_title,
  employment_status,
  is_active
)
select
  '20000000-0000-4000-8000-000000000001',
  p.id,
  p.full_name,
  role_kind,
  job_title,
  'active',
  true
from (
  values
    ('admin@gymops.dev', 'admin', 'Organization admin'),
    ('manager@gymops.dev', 'manager', 'Operations manager'),
    ('trainer@gymops.dev', 'personal_trainer', 'Personal trainer')
) as sample(email, role_kind, job_title)
join public.profiles p on p.email = sample.email
where not exists (
  select 1 from public.staff_members sm
  where sm.organization_id = '20000000-0000-4000-8000-000000000001'
    and sm.profile_id = p.id
);

insert into public.customers (
  organization_id,
  profile_id,
  membership_code,
  status,
  is_active
)
select
  '20000000-0000-4000-8000-000000000001',
  p.id,
  'M-SAMPLE-001',
  'active',
  true
from public.profiles p
where p.email = 'member@gymops.dev'
on conflict (organization_id, membership_code) do update set
  profile_id = excluded.profile_id,
  status = excluded.status,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.training_session_plans (
  id,
  organization_id,
  customer_id,
  trainer_id,
  title,
  session_kind,
  status,
  payment_status,
  payment_amount,
  amount_paid,
  payment_currency,
  payment_provider,
  external_payment_reference,
  total_sessions,
  default_duration_min,
  starts_on,
  ends_on,
  details,
  is_active
)
select
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  c.id,
  sm.id,
  'Sample boxing fundamentals',
  'boxing',
  'active',
  'partial',
  120000,
  60000,
  'TRY',
  'external',
  'sample-payment-reference',
  8,
  60,
  '2026-05-06',
  '2026-06-24',
  'Sample trainer-led boxing package seeded for manager calendar testing.',
  true
from public.customers c
join public.staff_members sm on sm.organization_id = c.organization_id
join public.profiles trainer_profile on trainer_profile.id = sm.profile_id
where c.membership_code = 'M-SAMPLE-001'
  and trainer_profile.email = 'trainer@gymops.dev'
on conflict (id) do update set
  customer_id = excluded.customer_id,
  trainer_id = excluded.trainer_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  payment_amount = excluded.payment_amount,
  updated_at = now();

insert into public.training_session_occurrences (
  id,
  plan_id,
  sequence_number,
  starts_at,
  ends_at,
  status,
  location_name,
  notes
)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    1,
    '2026-05-06 09:00:00+00',
    '2026-05-06 10:00:00+00',
    'scheduled',
    'Studio A',
    'Sample seeded session'
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    2,
    '2026-05-13 09:00:00+00',
    '2026-05-13 10:00:00+00',
    'scheduled',
    'Studio A',
    'Sample seeded session'
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    3,
    '2026-05-20 09:00:00+00',
    '2026-05-20 10:00:00+00',
    'scheduled',
    'Studio A',
    'Sample seeded session'
  ),
  (
    '31000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    4,
    '2026-05-27 09:00:00+00',
    '2026-05-27 10:00:00+00',
    'scheduled',
    'Studio A',
    'Sample seeded session'
  )
on conflict (id) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  updated_at = now();

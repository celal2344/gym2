# GymOps Project Context

## Product Purpose

GymOps is a gym operations platform for managing reservations, capacity, check-in, memberships, employees, gym users, and trainer-led session packages. The current MVP covers pool slots, personal trainer sessions, massage sessions, day-pass entry, QR/manual check-in, an admin operations surface, and a manager operations surface.

Payments are out of scope for collection. Payment references and payment state can enter this system from a separate payment flow.

## Current Apps

- Web: Next.js admin/operations UI in `apps/web`.
- Backend: Django REST Framework API runtime in `apps/backend`.
- Mobile: Expo customer companion in `apps/mobile`, currently secondary to web/backend work.

## Role Model

- `admin`: organization-scoped administrator. Can manage employees and gym users for their own organization.
- `manager`: organization-scoped operations role. Can review trainer activity and manage staff, personal trainers, gym goers, and trainer-led sessions for their own organization.
- `personal_trainer`: future role for trainer schedule/program workflows.
- `user`: gym customer/member role for self-service booking and profile workflows.

Admin scope is organization-local. There is no platform/global admin behavior in the current plan.

## Authorization Rules

- Supabase Auth JWT is the trusted identity source for app/API requests.
- Django verifies `Authorization: Bearer <token>` using `SUPABASE_JWT_SECRET`.
- JWT `sub` maps to `Profile.supabase_user_id`.
- A profile can resolve to active `StaffMember` and/or active `Customer` records.
- `GET /api/auth/me/` returns the current profile, role, organization, staff/customer record, and allowed panels.
- Admin endpoints require an active `StaffMember` with `role_kind = admin`.
- Manager endpoints require an active `StaffMember` with `role_kind = manager` or `role_kind = admin`.
- Admin and manager list/detail querysets are filtered to the staff member's organization.
- Removing employees or users means soft deactivation, not hard deletion.

## Current Authentication UX

- Web login route: `/login`
- Web profile route: `/profile`
- Logout is available from the profile page and manager sidebar.
- Protected web routes are `/admin`, `/manager`, `/trainer`, `/profile`, and `/app`.
- When Supabase public environment variables are configured, protected routes redirect unauthenticated users to `/login?next=<path>`.
- Login uses Supabase email/password auth, then calls Django `/api/auth/me/` to choose the default panel.
- The web proxy also calls `/api/auth/me/` for protected role panels. `/admin`, `/manager`, `/trainer`, and `/app` require their matching allowed panel before the route is served.

## Current Member Capabilities

- Web route: `/app`
- `GET /api/app/program-assignments/`

The member workspace currently shows assigned training program shells, status, date range, trainer/assigner name, and notes. This is the first customer self-service slice; booking, attendance history, memberships, documents, and notifications remain future work.

## Sample Users

Sample user metadata is shared from `packages/domain/src/auth/sample-users.ts`.

- `admin@gymops.dev` / `GymOpsAdmin123!`
- `manager@gymops.dev` / `GymOpsManager123!`
- `trainer@gymops.dev` / `GymOpsTrainer123!`
- `member@gymops.dev` / `GymOpsMember123!`

For Django-backed profile/staff/customer records, run `bun run --cwd apps/backend seed:sample-users`.
For local Supabase auth users, apply `supabase/seed.sql` after the Supabase migrations.

## Current Admin Capabilities

- `GET/POST /api/admin/employees/`
- `GET/PATCH/DELETE /api/admin/employees/{id}/`
- `GET/POST /api/admin/customers/`
- `GET/PATCH/DELETE /api/admin/customers/{id}/`

Employees include linked profile details, role, job title, employment status, start date, emergency contact, notes, and active state.

Users currently mean gym customers/members. They include linked profile details, membership code, customer status, notes, and active state.

## Current Manager Capabilities

- Web route: `/manager`
- Sidebar sections: dashboard, staff, trainers, gym goers, memberships, check-ins, sessions, programs.
- `GET/POST /api/manager/staff/`
- `GET/PATCH/DELETE /api/manager/staff/{id}/`
- `GET/POST /api/manager/trainers/`
- `GET/PATCH/DELETE /api/manager/trainers/{id}/`
- `GET/POST /api/manager/gym-goers/`
- `GET/PATCH/DELETE /api/manager/gym-goers/{id}/`
- `GET/POST /api/manager/membership-plans/`
- `GET/PATCH/DELETE /api/manager/membership-plans/{id}/`
- `GET/POST /api/manager/memberships/`
- `GET/PATCH/DELETE /api/manager/memberships/{id}/`
- `GET/POST /api/manager/check-ins/`
- `GET/PATCH /api/manager/check-ins/{id}/`
- `GET /api/manager/check-ins/summary/`
- `GET/POST /api/manager/session-plans/`
- `GET/PATCH/DELETE /api/manager/session-plans/{id}/`
- `POST /api/manager/session-plans/{id}/generate-occurrences/`
- `GET/POST /api/manager/session-occurrences/`
- `GET/PATCH/DELETE /api/manager/session-occurrences/{id}/`
- `GET /api/manager/session-occurrences/calendar/?year=YYYY&month=M`

Manager staff CRUD can manage staff records across operational roles. Manager trainer CRUD is a personal-trainer-specific staff surface and forces `role_kind = personal_trainer` on create/update. Manager gym-goer CRUD manages customer/member profiles. Membership plan CRUD defines sellable plan shells, access rules, billing cadence metadata, visit limits, session-credit quantities, and external price metadata. Member membership CRUD tracks active/trial/frozen/cancelled/expired lifecycle status, validity dates, remaining credits, auto-renew intent, cancellation reason, and external payment references. Check-ins create a general member attendance ledger for front-desk, kiosk, membership-code, QR, and manual access flows. All manager deletes are soft deactivations or lifecycle cancellations.

## Real-World Gym ERP Gap Notes

Market scan references: Glofox, PushPress, Wodify, Zen Planner, GymMaster, TeamUp, ABC Fitness, and ClubReady-style systems consistently emphasize membership lifecycle, fast check-ins, attendance reporting, member booking, staff/trainer calendars, reporting, leads/trials, communications, waivers, and documents.

Implemented after the initial MVP:

- Membership lifecycle: `MembershipPlan` and extended `Membership` now cover plan metadata, access rules, member status, freezes, cancellations, expiry, credits, and external payment reference tracking.
- General attendance: `MemberCheckIn` now covers front-desk and kiosk-style check-ins outside class/session booking records.
- Program assignment: `TrainingProgram` and `TrainingProgramAssignment` let admins/managers/trainers assign blank program shells to gym goers while detailed program creation remains a future feature.

Still missing compared with mature gym ERP systems:

- Member self-service booking with waitlists, capacity rules, cutoffs, and cancellation windows.
- Trainer self-service panel for own calendar, assigned members, attendance, and program updates.
- Member app/web panel for own memberships, bookings, attendance history, and documents.
- Lead/trial pipeline with source, follow-up dates, conversion, and lost reasons.
- Communication workflows for reminders, expiry alerts, no-show follow-up, and filtered announcements.
- Waivers/documents, emergency/medical notes, and agreement acceptance history.
- Operational reporting for retention, no-shows, class utilization, trainer utilization, expiring memberships, and attendance trends.

## Session Logic

Trainer-led sessions are modeled with two records:

- `TrainingSessionPlan`: the agreement/package between one trainer and one gym goer. It tracks session type, total session count, default duration, payment status, payment amount/currency, amount paid/due, payment provider, external payment reference, paid timestamp, payment notes, date range, and details.
- `TrainingSessionOccurrence`: one scheduled calendar appointment inside a plan. It tracks sequence number, start/end time, attendance status, location, and notes.

Supported session types currently include personal training, yoga, swimming lesson, boxing, pilates, rehab, and other. Payment is recorded as external metadata only; GymOps still does not collect payments directly.

This split is intentional: plan rows answer "what did this member buy and with whom?" while occurrence rows answer "what is happening on the calendar and what happened at attendance time?"

Session occurrences reject trainer and gym-goer time conflicts for active calendar statuses. Managers can generate recurring occurrences from a plan by start date, start time, weekdays, count, duration, location, and notes.

## Audit Logging

`AuditLog` stores organization-scoped mutation history for admin and manager changes. It records actor profile/staff, action key, target type/id, summary, and JSON metadata. Employee, customer, session plan, and session occurrence changes write audit records.

## Package-First Convention

All shared models, types, schemas, constants, translations, and domain contracts must live under `packages/`.

- TypeScript contracts and Zod schemas: `packages/domain`, split by context:
- `accounts`: employees, customers, profile input schemas
- `auth`: role constants and role types
- `bookings`: booking schemas and booking status/channel constants
- `memberships`: membership plan, membership lifecycle, and general check-in schemas
- `services`: service, slot, and resource schemas
- `sessions`: trainer-led session plan and occurrence schemas
- `dashboard`: shared dashboard metric fixtures
- Django ORM models, serializers, permissions, services, migrations, and tests: `packages/backend-domain`.
- App folders should consume package contracts rather than defining independent domain shapes.
- OpenAPI schema output lives at `apps/backend/schema.yml`; generated frontend API types live at `apps/web/lib/api/generated/schema.d.ts`. Regenerate with `bun run api:generate-types`.
- Runtime API docs are available from the backend at `/api/schema/` for OpenAPI, `/api/docs/` for Swagger UI, and `/api/scalar/` for Scalar.
- Web CRUD tables use a shared shadcn/TanStack DataTable wrapper. Web CRUD forms use React Hook Form with shadcn Field components and package-level Zod schemas. Zod validation messages are stored as translation keys and rendered through `packages/domain/src/i18n`.
- Frontend route files are thin wrappers. Feature UI lives under `apps/web/features/<feature>/` with separated `components`, `constants.ts`, and utility files where needed. Agent-facing frontend rules live in `AGENTS.md`.

## Future Work

- Extend manager sessions with trainer availability-rule checks and richer drag/drop calendar editing.
- Implement personal trainer panel for schedule, assigned customers, and program updates.
- Implement user/customer web self-service panel.
- Add Supabase RLS updates matching every Django schema migration.

# GymOps Project Reference

## Current Architecture

GymOps is a Turborepo monorepo for a gym reservation system covering pool slots, trainer-led session packages, massage bookings, day-pass entry, QR check-in, memberships/credits, and operational dashboards. Payment collection is intentionally excluded from the implementation; payment status, provider, paid amount, and references are accepted as external inputs.

## Apps

- `apps/web`: Next.js App Router web operations surface using shadcn/ui and Supabase client helpers. Route files stay thin and delegate to `apps/web/features/*`. Current panels include login, profile/logout, admin CRUD, and manager dashboard/staff/trainer/gym-goer/session CRUD.
- `apps/mobile`: Expo React Native customer companion using the shared domain package.
- `apps/backend`: Django + Django REST Framework runtime shell. It owns settings, URL routing, OpenAPI docs, and process commands. OpenAPI schema is served at `/api/schema/`, Swagger at `/api/docs/`, and Scalar at `/api/scalar/`.

## Packages

- `packages/domain`: canonical TypeScript domain contracts, Zod schemas, demo fixtures, and shared i18n JSON. Schemas are split by context under `accounts`, `auth`, `bookings`, `services`, `sessions`, and `dashboard`.
- `packages/backend-domain`: canonical Django domain package. Django ORM models, serializers, transaction services, localized errors, API viewsets, tests, and migrations live here so backend models are kept in `packages/`.
- `packages/ui`: shared React UI package from the Turbo template.
- `packages/eslint-config` and `packages/typescript-config`: shared repo tooling.

## Domain Rules

- Reservations consume `slot_inventory` capacity; they are not raw calendar events.
- Trainer-led sessions use `training_session_plans` for package/payment context and `training_session_occurrences` for scheduled calendar appointments.
- Session occurrence creation rejects trainer and gym-goer calendar conflicts for active statuses.
- Manager session plans can generate recurring scheduled occurrences from weekday rules.
- Admin and manager mutations write organization-scoped `audit_logs`.
- Capacity mutations happen in Django transactions with row locks.
- QR is a check-in authorization token, not identity.
- Backend errors use translation keys from `packages/domain/src/i18n/*.json`.
- Web auth uses Supabase email/password login, then Django `/api/auth/me/` as the source of role and panel access.
- Protected web routes check role-specific allowed panels through the route proxy before serving panel pages.
- Supabase production schema is represented in `supabase/migrations`.
- Generated OpenAPI types live in `apps/web/lib/api/generated/schema.d.ts`.
- GitHub Actions live under `.github/workflows`; CI uses Bun, Python 3.14, Django tests, type checks, lint, and Next build.

## Verification Commands

- `bun run lint`
- `bun run check-types`
- `bun run test`
- `bun run e2e`
- `bun run build`
- `bun run api:generate-types`
- `bun --cwd apps/backend run migrate`
- `bun run --cwd apps/backend seed:sample-users`
- `bun --cwd apps/backend run dev`

## Notes For Future Work

- Keep all cross-application models, types, schemas, constants, and translations in `packages/`.
- Future coding agents must read `AGENTS.md` before frontend work; it contains the current frontend refactoring rules.
- Agents should commit small verified checkpoints and push regularly when the remote is available, following the git workflow rules in `AGENTS.md`.
- Product/domain context lives in `project_context.md`; update it when roles, panels, or domain rules change.
- The repo package manager is Bun `1.3.13`; use `bun install` and commit `bun.lock`.
- Sample auth credentials live in `packages/domain/src/auth/sample-users.ts`; keep them aligned with `supabase/seed.sql` and the Django `seed_sample_users` command.
- Tailwind v4 source discovery is declared in `apps/web/app/globals.css`; keep monorepo UI/domain paths listed there when adding shared class-heavy packages.
- If Django models change, update both `packages/backend-domain/gymops_domain` migrations and the Supabase SQL migration strategy.
- If TypeScript schemas change, update `packages/domain` first and consume from web/mobile.
- Web CRUD tables should use `components/data/data-table.tsx` backed by TanStack Table. Web CRUD forms should use React Hook Form, shadcn `Field`, and package-level Zod form schemas with translated error keys from `packages/domain/src/i18n`.
- If API serializers or routes change, regenerate OpenAPI types with `bun run api:generate-types`.
- Do not add payment collection flows until a separate payment system contract is defined.

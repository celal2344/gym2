# GymOps

GymOps is a Turborepo monorepo for gym reservations and operations. It includes a Next.js web dashboard, Expo mobile companion, Django REST API, Supabase schema/RLS migrations, and shared domain packages.

Payments are intentionally not implemented. The backend accepts external payment references so a separate payment system can feed this platform later.

## Structure

- `apps/web`: Next.js App Router + shadcn/ui operations dashboard.
- `apps/mobile`: Expo React Native customer companion.
- `apps/backend`: Django runtime shell and API process.
- `packages/domain`: shared TypeScript types, Zod schemas, fixtures, and i18n.
- `packages/backend-domain`: Django ORM models, serializers, services, API viewsets, migrations, and tests.
- `supabase/migrations`: production Supabase Postgres/RLS schema.

## Setup

```bash
bun install
python -m venv apps/backend/.venv
apps/backend/.venv/Scripts/pip install -r apps/backend/requirements.txt
```

On macOS/Linux, use `apps/backend/.venv/bin/pip`.

## Development

```bash
bun run dev
bun --cwd apps/backend run migrate
bun --cwd apps/backend run dev
```

Backend API docs:

- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`
- Scalar API reference: `http://localhost:8000/api/scalar/`

## Verification

```bash
bun run lint
bun run check-types
bun run test
bun run e2e
bun run build
```

See `PROJECT_REFERENCE.md` for project conventions and `DEPLOYMENT_PLAN.md` for deployment options.

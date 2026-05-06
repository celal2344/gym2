# GymOps Agent Guide

## Frontend Refactoring Rules

- Keep route files thin. Files under `apps/web/app/**/page.tsx` should delegate to feature components and should not contain large UI components, CRUD panels, table definitions, or form logic.
- Put feature-owned UI under `apps/web/features/<feature>/`. Use `components/`, `constants.ts`, `utils.ts`, and `types.ts` inside each feature when needed.
- Do not add feature components directly under route folders. Route folders are for Next.js routing files only.
- Keep components focused and short. Split large screens into page shells, panels, tables, forms, and summary/overview components.
- Separate constants and utility functions from components. Reuse existing constants and helpers before adding new ones.
- Shared generic UI belongs in `apps/web/components/ui`. Shared app-level components belong in `apps/web/components`.
- CRUD tables should use the shared TanStack/shadcn wrapper at `apps/web/components/data/data-table.tsx`.
- CRUD forms should use React Hook Form, shadcn `Field` components, and package-level Zod schemas from `packages/domain`.
- Zod validation messages should be translation keys rendered through `packages/domain/src/i18n`.
- Keep cross-app models, schemas, constants, and translations in `packages/` rather than duplicating shapes in app folders.

## Git Workflow

- Commit consistently as work progresses. Prefer small commits after each coherent, verified change instead of one large final commit.
- Push commits regularly when the remote is configured and network access is available.
- Before every commit, run the relevant checks for the touched area and inspect `git status` plus the staged diff.
- Do not include unrelated user changes in a commit. If unrelated files are already modified, leave them unstaged.
- Never commit secrets, local environment files, generated reports, local databases, or dependency/build artifacts that should be ignored.

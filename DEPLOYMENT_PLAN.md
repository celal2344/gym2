# Deployment Plan

## Default Path

Use Vercel for `apps/web`, managed Supabase for Postgres/Auth/Storage/RLS, Django as the API runtime, and Expo EAS for mobile builds.

1. Create Supabase staging and production projects.
2. Store Supabase project refs and access token in GitHub secrets.
3. Push `supabase/migrations` to staging first, then production after smoke tests.
4. Deploy `apps/web` to Vercel with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy Django to a Python host such as Render, Fly.io, Railway, or a container platform with `DATABASE_URL` pointing at Supabase Postgres.
6. Build mobile through EAS with `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Render Backend

Use `apps/backend` as the Render root directory.

- Build command: `python -m pip install --upgrade pip && pip install -r requirements.txt`
- Start command: `bun run start`

The Bun start script delegates to Gunicorn:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

## Alternatives

- Web: Netlify with OpenNext if the team prefers Netlify previews and branch contexts.
- Backend: Render or Railway for low-ops Django hosting; Fly.io or Docker/Kubernetes when infra control matters.
- Database: Managed Supabase is preferred. Self-hosted Supabase is not recommended for the first production client because it adds backup, branching, and operations burden.
- Mobile: EAS Build and Submit are preferred. Internal distribution can be used before App Store / Play Store submission.

## Environments

- Local: `bun run dev`, local SQLite or Supabase local stack.
- Preview: GitHub PR, Vercel preview, Supabase preview branch, EAS preview profile.
- Staging: stable staging web/API/mobile build for acceptance testing.
- Production: main domain, production Supabase project, store/internal mobile release.

## Required GitHub Secrets

- `VERCEL_TOKEN`
- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` if using Netlify
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_PROJECT_REF_PROD`
- `EXPO_TOKEN`

## Release Gates

- `bun run lint`
- `bun run check-types`
- `bun run test`
- `bun run build`
- Django `manage.py check`
- Supabase migration review
- Manual smoke test: create booking, reject full slot, check in once, reject duplicate check-in

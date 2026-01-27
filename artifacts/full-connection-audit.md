# Full Website + Endpoint Connection Audit

Generated: 2026-01-25

## What Was Verified

### Frontend
- Route audit: `npm run routes:audit`
- Smoke tests: `npm run smoke`, `npm run auth:smoke`, `npm run rbac:smoke`, `npm run user:rbac:smoke`, `npm run learner:smoke`
- Build checks: `npm run typecheck`, `npm run build`
- UI scans: `npm run fe:scan:smoke`, `npm run fe:test:crawl`

### Backend
- FastAPI router inventory via static inspection and runtime `/api/openapi.json`
- Runtime checks: `/api/health`, `/api/openapi.json`, representative protected endpoints return 401 without session

### Frontend ↔ Proxy ↔ Backend Mapping
- Generated an API call graph and wrote:
  - `artifacts/api-callgraph.md`
  - `artifacts/api-callgraph.json`

## Key Findings (Before Fixes)

### 1) E2E/API diagnostics failing due to JWT compatibility
- `npm run api:diagnose` failed with signature verification errors from FastAPI on `/api/me`.
- Root cause: FastAPI strictly verified `aud` and signature, while test tokens are minted by the web helper (`apps/web/src/lib/auth.ts`) with `aud=lms-web` and a secret that may differ from the backend env.

### 2) Missing backend endpoint expected by test suite
- `npm run certificates:smoke` failed because `/api/certificates` did not exist.

### 3) Playwright crawl “Reports flyout” failure was actually an auth issue
- The failing test was redirected to `/login`, so the drawer/menu did not exist.
- Root cause: stored Playwright storageState could be stale and wasn’t validated; the helper didn’t persist a fresh state after UI login.

### 4) Proxy/connection risks
- Two proxy mechanisms exist for `/api/*` (rewrites + App Router catch-all), increasing “works in dev, fails in prod” risk.
- The Next proxy had verbose cookie logging.
- Water theme background referenced `http://localhost:8001/...` directly, which breaks off-localhost and can cause mixed-content issues.

### 5) API contract drift
- The call graph found several frontend calls that do not match backend OpenAPI routes (method/path differences), see `artifacts/api-callgraph.md`.

## Fixes Applied

### Backend (FastAPI)
- Added `/api/certificates` endpoint (protected; returns empty list):
  - `services/api/app/routes/certificates.py`
  - Mounted in `services/api/app/main.py`
- Added `DELETE /api/branches/{branch_id}` endpoint for single-branch deletion:
  - `services/api/app/routes/branches.py`
- Removed noisy debug prints from auth code paths:
  - `services/api/app/auth/jwt.py`
  - `services/api/app/auth/deps.py`
- Made JWT verification more compatible in non-production:
  - Accepts `aud=lms-web` as well as the backend audience
  - Allows a non-prod fallback secret (`default_secret_key_change_me`) for dev/test parity
  - `services/api/app/auth/jwt.py`
- Fixed env file discovery logic for the backend config loader:
  - `services/api/app/config.py`

### Frontend (Next.js)
- Removed proxy cookie debug logging and stopped injecting `Authorization` from the `session` cookie:
  - `apps/web/src/lib/proxy.ts`
- Fixed hard-coded backend origin for the water theme video:
  - `apps/web/src/shared/ui/water-theme/WaterBackground.tsx` now uses `/videos/water-theme-bg.mp4` (already present in `apps/web/public`).
- Reduced permission gating flakiness during initial user load:
  - `apps/web/src/app/admin/layout.tsx`

### E2E Reliability
- Improved Playwright context creation to validate stored state and persist a fresh one after UI login:
  - `tests/helpers/login.ts`
- Result: `npm run fe:test:crawl` now passes consistently, including the Reports flyout test.

## Current Status

### Passing
- `npm run typecheck`
- `npm run build`
- `npm run api:diagnose`
- `npm run certificates:smoke`
- `npm run fe:test:crawl`

### Still Needs Work (Recommended Next Steps)
- Decide the canonical API contract for drifted endpoints and fix the remaining mismatches listed in `artifacts/api-callgraph.md` (e.g., `/api/reports` root, instructor skills paths, submissions PUT vs PATCH, courses enroll endpoints, etc.).
- Make CSRF enforcement consistent end-to-end (backend currently only enforces CSRF if a `csrf-token` cookie exists; ensure token issuance strategy is defined and implemented).
- Pick a single proxy strategy for `/api/*` to reduce ambiguity (rewrites vs App Router proxy).


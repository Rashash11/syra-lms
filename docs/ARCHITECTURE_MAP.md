# Architecture Truth Map

## Canonical Backend
- **Service**: FastAPI (Python)
- **Path**: `services/api`
- **Entry Point**: `app.main:app`
- **Port**: 8001
- **API Base Path**: `/api`
- **Docs**: `/api/docs`

## Frontend
- **Framework**: Next.js (App Router)
- **Path**: `apps/web`
- **Port**: 3000
- **Proxy**: Rewrites `/api/*` to `http://localhost:8001/api/*`

## Infrastructure
- **Database**: PostgreSQL
- **Port**: 5433 (Mapped via Docker)
- **Driver**: `postgresql+asyncpg`
- **ORM**: SQLAlchemy (Async)

## Authentication Strategy
- **Type**: Hybrid (Proxy + JWT)
- **Flow**:
  1. Frontend receives credentials.
  2. Proxies to Backend `/api/auth/login`.
  3. Backend issues JWT (Access & Refresh).
  4. Frontend stores in Cookies.
  5. Middleware validates JWT for RBAC.

## Database Access Layer
- **Models**: `services/api/app/db/models.py`
- **Migrations**: Alembic (`services/api/alembic`)

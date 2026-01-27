# Executive Review Pack

## System Overview
- FastAPI backend with SQLAlchemy ORM and Postgres (async via asyncpg).
- Multi-tenant isolation enforced via:
  - TenantMiddleware: extracts tenantId from JWT and sets context variables.
  - SQLAlchemy hooks: automatically inject tenantId on inserts and filter selects by tenantId; soft-delete is also enforced.
- RBAC:
  - DB-backed permissions resolved from AuthRole/AuthPermission tables.
  - Base admin permissions applied if tables are incomplete and activeRole == ADMIN.
  - All protected endpoints use RequireAuth + permission checks.

## Database Summary (Key Tables & Constraints)
- users: core user profile, role fields, token_version used for session invalidation.
- courses: course catalog and instructor ownership.
- enrollments: user-course enrollment with status and progress.
- groups: user cohorts; linking via group_members and group_courses.
- password_reset_tokens: tokens for resetting passwords; unique token, usedAt and expiresAt drive validity.
- file_visibility: row-level file permission entries.
- course_sections: ordered sections per course.
- points_ledger: gamification points per user.

Constraints (examples):
- Composite uniqueness enforced at DB (e.g. group_members tenantId+groupId+userId; group_courses tenantId+groupId+courseId).
- NOT NULL and defaults enforced in ORM mapping for updatedAt/createdAt.

## Endpoint Inventory (selected)
- Auth: POST /api/auth/login, POST /api/auth/logout, POST /api/auth/reset-password (unauth; tenant-scoped via token).
- Users: GET /api/users (RequireAuth, permission user:read), POST /api/users (user:create), PUT/DELETE user:update/user:delete.
- Courses: GET /api/courses (course:read), POST /api/courses (course:create), PUT /api/courses/{id} (course:update).
- Groups: GET /api/groups (groups:read), POST /api/groups (groups:create), POST /api/groups/{id}/members (groups:update), POST /api/groups/{id}/courses (groups:update).
- Enrollments: POST /api/courses/{courseId}/enrollments (course:update), GET /api/courses/{courseId}/enrollments (course:read).
- Reports/Dashboard: GET /api/reports/overview, GET /api/dashboard (RequireAuth, permissions vary).

## Evidence (selected outputs)

### Smoke Runner (GET)
```
endpoint | status | error
/api/auth/me | 200 |
/api/users?limit=5 | 200 |
/api/courses?limit=5 | 200 |
/api/groups?limit=5 | 200 |
/api/learning-paths?limit=5 | 200 |
/api/reports/overview | 200 |
/api/dashboard | 200 |
```

### Write Smoke Runner (POST/PUT/DELETE including reset-password)
```
POST /api/users | 200
PUT /api/users/{id} | 200
POST /api/courses | 200
POST /api/courses/{courseId}/sections | 200
PUT /api/courses/{courseId} | 200
POST /api/courses/{courseId}/enrollments | 200
GET /api/courses/{courseId}/enrollments | 200
POST /api/groups | 200
GET /api/groups/{groupId} | 200
POST /api/groups/{groupId}/members | 200
POST /api/groups/{groupId}/courses | 200
POST /api/auth/forgot-password | 200
POST /api/auth/reset-password | 200
POST /api/auth/login (with new password) | 200
DELETE /api/users/{id} | 200
```

### Tenant Isolation Audit
```
PASS GET /api/users?limit=5 -> 200
PASS GET /api/courses?limit=5 -> 200
PASS GET /api/groups?limit=5 -> 200
PASS GET /api/learning-paths?limit=5 -> 200
PASS GET /api/reports/overview -> 200
PASS GET /api/dashboard -> 200
PASS GET /api/groups/{id} -> 404
PASS GET /api/courses/{id} -> 404
PASS GET /api/courses/{id}/enrollments -> 200
POST /api/groups/{id}/members with tenant B -> 404 PASS
POST /api/groups/{id}/courses with tenant B -> 404 PASS
SUMMARY: PASS=9 FAIL=0
```

### RBAC Audit
```
PASS LEARNER POST /api/courses -> 403
PASS LEARNER POST /api/groups -> 403
PASS LEARNER GET /api/users?limit=5 -> 403
PASS ADMIN POST /api/courses -> 200
PASS ADMIN POST /api/groups -> 200
PASS ADMIN GET /api/users?limit=5 -> 200
SUMMARY: PASS=6 FAIL=0
```

### Schema Drift Report
See reports/DRIFT_REPORT.md. Highlights:
- DB has additional columns not mapped in ORM for courses, enrollments, password_reset_tokens, course_sections (expected; Prisma is canonical superset).
- All target tables exist with mapped critical columns present.

## Known Gaps / Roadmap
- Several Prisma fields not yet exposed in FastAPI (intro video metadata, dripType/dripValue).
- Schema drift shows unique constraints not enumerated in pg_constraint query for reporting; consider broadening detection to indexes.
- Expand tests for more write endpoints (assignments, learning paths).

## How to Run Locally
```
# Start API
python -m uvicorn app.main:app --reload --port 8001

# GET smoke
python scripts/smoke_runner.py

# Write smoke
python scripts/write_smoke_runner.py

# Tenant isolation audit
python scripts/tenant_isolation_audit.py

# RBAC audit
python scripts/rbac_audit.py

# Schema drift check
python scripts/schema_drift_check.py
```

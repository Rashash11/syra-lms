# Autopilot Repair Report - 2026-01-21 04:23:40.989423

## Backend Smoke Tests (GET)
**Status**: ✅ PASS

```
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
endpoint | status | error
/api/auth/me | 200 | 
/api/users?limit=5 | 200 | 
/api/courses?limit=5 | 200 | 
/api/groups?limit=5 | 200 | 
/api/learning-paths?limit=5 | 200 | 
/api/reports/overview | 200 | 
/api/dashboard | 200 | 

```

## Backend Write Smoke Tests
**Status**: ✅ PASS

```
9-bd86-c44f069fc1ab', 'title': 'Intro Section', 'orderIndex': 1, 'units': []}
PUT /api/courses/d2e4698e-1c97-493b-b406-d2fdadaecb94 | 200 | {'id': 'd2e4698e-1c97-493b-b406-d2fdadaecb94', 'code': 'COURSE-1768962224', 'title': 'Smoke Course 1768962224', 'status': 'PUBLISHED'}
POST /api/courses/d2e4698e-1c97-493b-b406-d2fdadaecb94/enrollments | 200 | {'success': True}
GET /api/courses/d2e4698e-1c97-493b-b406-d2fdadaecb94/enrollments | 200 | {'enrollments': [{'id': '478d1c81-2483-400f-aad4-ab7df597ba10', 'userId': 'dec0aae9-cfe4-4575-b121-289fee48d36d', 'status': 'NOT_STARTED', 'progress': 0, 'enrolledAt': '2026-01-21T02:23:44.623101', 'c
POST /api/groups | 200 | {'ok': True, 'id': '02d05dce-2baa-41f0-97cd-44d226554ef1', 'name': 'Smoke Group 1768962224', 'description': None, 'branchId': None, 'createdAt': '2026-01-21T02:23:44.646000'}
GET /api/groups/02d05dce-2baa-41f0-97cd-44d226554ef1 | 200 | {'id': '02d05dce-2baa-41f0-97cd-44d226554ef1', 'name': 'Smoke Group 1768962224', 'description': None, 'branchId': None, 'instructorId': None, 'createdAt': '2026-01-21T02:23:44.646000', 'updatedAt': '2
POST /api/groups/02d05dce-2baa-41f0-97cd-44d226554ef1/members | 200 | {'ok': True}
POST /api/groups/02d05dce-2baa-41f0-97cd-44d226554ef1/courses | 200 | {'ok': True}
GET /api/groups | 200 | {'data': [{'id': '02d05dce-2baa-41f0-97cd-44d226554ef1', 'name': 'Smoke Group 1768962224', 'description': None, 'branchId': None, 'instructorId': None, 'createdAt': '2026-01-21T02:23:44.646000', 'upda
POST /api/auth/forgot-password | 200 | {'ok': True, 'message': 'If the email exists, a reset link has been sent'}
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
POST /api/auth/reset-password | 200 | {'ok': True}
POST /api/auth/login | 200 | {'ok': True, 'userId': 'dec0aae9-cfe4-4575-b121-289fee48d36d', 'role': 'LEARNER', 'activeRole': 'LEARNER'}
DELETE /api/users/dec0aae9-cfe4-4575-b121-289fee48d36d | 200 | {'success': True, 'deleted': True}

```

## Tenant Isolation Audit
**Status**: ✅ PASS

```
HOOK DEBUG: Select on Tenant, Tenant=None, SoftDelete=True
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
HOOK DEBUG: Select on User, Tenant=None, SoftDelete=True
HOOK DEBUG: Applying soft delete filter to User
=== Tenant Isolation Audit ===
PASS GET /api/users?limit=5 -> 200
PASS GET /api/courses?limit=5 -> 200
PASS GET /api/groups?limit=5 -> 200
PASS GET /api/learning-paths?limit=5 -> 200
PASS GET /api/reports/overview -> 200
PASS GET /api/dashboard -> 200
PASS GET /api/groups/7421714f-1298-436d-b5a1-37c514548a0f -> 404
PASS GET /api/courses/cb1d6795-97a3-4291-8cfd-a91eed37f95f -> 404
PASS GET /api/courses/cb1d6795-97a3-4291-8cfd-a91eed37f95f/enrollments -> 200
=== Write Isolation ===
POST /api/groups/{id}/members with tenant B -> 404 PASS
POST /api/groups/{id}/courses with tenant B -> 404 PASS
SUMMARY: PASS=9 FAIL=0

```

## Frontend Lint
**Status**: ✅ PASS

```

./src/app/admin/users/page.tsx
144:8  Warning: React Hook useEffect has a missing dependency: 'fetchUsers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules

```

## Frontend Typecheck
**Status**: ✅ PASS


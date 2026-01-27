# OpenAPI Endpoint Audit

- Base URL: http://127.0.0.1:8001
- OpenAPI: /api/openapi.json
- Rows: 224 (executed: 180, skipped: 44)
- Failures: 0 (HTTP 5xx: 0)

method | path | variant | status | ok | content-type | error
---|---|---:|---:|---:|---|---
DELETE | /api/admin/notifications/{notification_id} | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
DELETE | /api/courses/{course_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id
DELETE | /api/courses/{course_id}/enrollments | skipped:no-sample | 0 | false |  | missing sample for params: course_id
DELETE | /api/courses/{course_id}/sections/{section_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id, section_id
DELETE | /api/courses/{course_id}/units/{unit_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id, unit_id
DELETE | /api/enrollments/{enrollment_id} | skipped:no-sample | 0 | false |  | missing sample for params: enrollment_id
DELETE | /api/files/{file_id} | skipped:no-sample | 0 | false |  | missing sample for params: file_id
DELETE | /api/learning-paths/{path_id}/courses/{course_id} | skipped:no-sample | 0 | false |  | missing sample for params: path_id, course_id
DELETE | /api/notifications/{notification_id} | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
DELETE | /api/users/{user_id} | skipped:no-sample | 0 | false |  | missing sample for params: user_id
DELETE | /api/{path} | skipped:no-sample | 0 | false |  | missing sample for params: path
GET | /api/admin/notifications/{notification_id} | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
GET | /api/courses/{course_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/enrollment-requests | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/enrollments | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/files | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/sections | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/units | skipped:no-sample | 0 | false |  | missing sample for params: course_id
GET | /api/courses/{course_id}/units/{unit_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id, unit_id
GET | /api/files/{file_id} | skipped:no-sample | 0 | false |  | missing sample for params: file_id
GET | /api/notifications/{notification_id} | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
GET | /api/submissions/{submission_id} | skipped:no-sample | 0 | false |  | missing sample for params: submission_id
GET | /api/users/{user_id} | skipped:no-sample | 0 | false |  | missing sample for params: user_id
GET | /api/{path} | skipped:no-sample | 0 | false |  | missing sample for params: path
PATCH | /api/admin/notifications/{notification_id}/toggle | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
PATCH | /api/courses/{course_id}/reorder | skipped:no-sample | 0 | false |  | missing sample for params: course_id
PATCH | /api/submissions/{submission_id} | skipped:no-sample | 0 | false |  | missing sample for params: submission_id
PATCH | /api/{path} | skipped:no-sample | 0 | false |  | missing sample for params: path
POST | /api/admin/notifications/{notification_id}/duplicate | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
POST | /api/admin/notifications/{notification_id}/preview | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
POST | /api/admin/users/{user_id}/impersonate | skipped:no-sample | 0 | false |  | missing sample for params: user_id
POST | /api/courses/{course_id}/enrollments | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/courses/{course_id}/image | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/courses/{course_id}/import-unit | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/courses/{course_id}/sections | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/courses/{course_id}/units | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/learner/courses/{course_id}/last-unit | skipped:no-sample | 0 | false |  | missing sample for params: course_id
POST | /api/{path} | skipped:no-sample | 0 | false |  | missing sample for params: path
PUT | /api/admin/notifications/{notification_id} | skipped:no-sample | 0 | false |  | missing sample for params: notification_id
PUT | /api/courses/{course_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id
PUT | /api/courses/{course_id}/sections/{section_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id, section_id
PUT | /api/courses/{course_id}/units/{unit_id} | skipped:no-sample | 0 | false |  | missing sample for params: course_id, unit_id
PUT | /api/users/{user_id} | skipped:no-sample | 0 | false |  | missing sample for params: user_id
PUT | /api/{path} | skipped:no-sample | 0 | false |  | missing sample for params: path
DELETE | /api/admin/security/sessions | unauth | 401 | true | application/json | 
DELETE | /api/assignments/98c60659-4c53-4a50-b9c4-4a555fd79093 | unauth | 401 | true | application/json | 
DELETE | /api/automations | unauth | 401 | true | application/json | 
DELETE | /api/branches | unauth | 401 | true | application/json | 
DELETE | /api/branches/a56fa416-4eaf-4a46-8153-52f4eb6d2d94 | unauth | 401 | true | application/json | 
DELETE | /api/categories | unauth | 401 | true | application/json | 
DELETE | /api/courses | unauth | 401 | true | application/json | 
DELETE | /api/groups | unauth | 401 | true | application/json | 
DELETE | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4 | unauth | 401 | true | application/json | 
DELETE | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/enrollments | unauth | 401 | true | application/json | 
DELETE | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/sections/00000000-0000-0000-0000-000000000000 | unauth | 401 | true | application/json | 
DELETE | /api/users | unauth | 401 | true | application/json | 
GET | /api/admin/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/options | admin | 200 | true | application/json | 
GET | /api/admin/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/options | unauth | 401 | true | application/json | 
GET | /api/admin/notifications | admin | 200 | true | application/json | 
GET | /api/admin/notifications | unauth | 401 | true | application/json | 
GET | /api/admin/notifications/events | admin | 404 | true | application/json | 
GET | /api/admin/notifications/events | unauth | 401 | true | application/json | 
GET | /api/admin/permissions | admin | 200 | true | application/json | 
GET | /api/admin/permissions | unauth | 401 | true | application/json | 
GET | /api/admin/roles | admin | 200 | true | application/json | 
GET | /api/admin/roles | unauth | 401 | true | application/json | 
GET | /api/admin/security/audit | admin | 200 | true | application/json | 
GET | /api/admin/security/audit | unauth | 401 | true | application/json | 
GET | /api/admin/security/sessions | admin | 200 | true | application/json | 
GET | /api/admin/security/sessions | unauth | 401 | true | application/json | 
GET | /api/admin/settings | admin | 200 | true | application/json | 
GET | /api/admin/settings | unauth | 401 | true | application/json | 
GET | /api/admin/user-types | admin | 200 | true | application/json | 
GET | /api/admin/user-types | unauth | 401 | true | application/json | 
GET | /api/admin/users/export | admin | 200 | true | application/json | 
GET | /api/admin/users/export | unauth | 401 | true | application/json | 
GET | /api/admin/users/preview-permissions | admin | 200 | true | application/json | 
GET | /api/admin/users/preview-permissions | unauth | 401 | true | application/json | 
GET | /api/assignments | admin | 200 | true | application/json | 
GET | /api/assignments | unauth | 401 | true | application/json | 
GET | /api/assignments/98c60659-4c53-4a50-b9c4-4a555fd79093 | admin | 200 | true | application/json | 
GET | /api/assignments/98c60659-4c53-4a50-b9c4-4a555fd79093 | unauth | 401 | true | application/json | 
GET | /api/auth/me | admin | 200 | true | application/json | 
GET | /api/auth/me | unauth | 401 | true | application/json | 
GET | /api/auth/permissions | admin | 200 | true | application/json | 
GET | /api/auth/permissions | unauth | 401 | true | application/json | 
GET | /api/automations | admin | 200 | true | application/json | 
GET | /api/automations | unauth | 401 | true | application/json | 
GET | /api/branches | admin | 200 | true | application/json | 
GET | /api/branches | unauth | 401 | true | application/json | 
GET | /api/branches/a56fa416-4eaf-4a46-8153-52f4eb6d2d94 | admin | 200 | true | application/json | 
GET | /api/branches/a56fa416-4eaf-4a46-8153-52f4eb6d2d94 | unauth | 401 | true | application/json | 
GET | /api/calendar-events | admin | 200 | true | application/json | 
GET | /api/calendar-events | unauth | 401 | true | application/json | 
GET | /api/catalog | admin | 200 | true | application/json | 
GET | /api/catalog | unauth | 200 | true | application/json | 
GET | /api/categories | admin | 200 | true | application/json | 
GET | /api/categories | unauth | 401 | true | application/json | 
GET | /api/categories/97e8d5f6-86a9-4b88-a082-4f297805ac74 | admin | 200 | true | application/json | 
GET | /api/categories/97e8d5f6-86a9-4b88-a082-4f297805ac74 | unauth | 401 | true | application/json | 
GET | /api/certificates | admin | 200 | true | application/json | 
GET | /api/certificates | unauth | 401 | true | application/json | 
GET | /api/conferences | admin | 200 | true | application/json | 
GET | /api/conferences | unauth | 401 | true | application/json | 
GET | /api/courses | admin | 200 | true | application/json | 
GET | /api/courses | unauth | 401 | true | application/json | 
GET | /api/courses/catalog | admin | 200 | true | application/json | 
GET | /api/courses/catalog | unauth | 401 | true | application/json | 
GET | /api/courses/test | admin | 200 | true | application/json | 
GET | /api/courses/test | unauth | 200 | true | application/json | 
GET | /api/dashboard | admin | 200 | true | application/json | 
GET | /api/dashboard | unauth | 401 | true | application/json | 
GET | /api/enrollments | admin | 200 | true | application/json | 
GET | /api/enrollments | unauth | 401 | true | application/json | 
GET | /api/groups | admin | 200 | true | application/json | 
GET | /api/groups | unauth | 401 | true | application/json | 
GET | /api/groups/ea0df3dd-33d2-4aa2-8456-14affc4cf825 | admin | 200 | true | application/json | 
GET | /api/groups/ea0df3dd-33d2-4aa2-8456-14affc4cf825 | unauth | 401 | true | application/json | 
GET | /api/health | admin | 200 | true | application/json | 
GET | /api/health | unauth | 200 | true | application/json | 
GET | /api/instructor/conferences | admin | 200 | true | application/json | 
GET | /api/instructor/conferences | unauth | 401 | true | application/json | 
GET | /api/instructor/courses | admin | 200 | true | application/json | 
GET | /api/instructor/courses | unauth | 401 | true | application/json | 
GET | /api/instructor/grading-hub | admin | 200 | true | application/json | 
GET | /api/instructor/grading-hub | unauth | 401 | true | application/json | 
GET | /api/instructor/groups | admin | 200 | true | application/json | 
GET | /api/instructor/groups | unauth | 401 | true | application/json | 
GET | /api/learner/assignments | admin | 200 | true | application/json | 
GET | /api/learner/assignments | unauth | 401 | true | application/json | 
GET | /api/learner/enrollments | admin | 200 | true | application/json | 
GET | /api/learner/enrollments | unauth | 401 | true | application/json | 
GET | /api/learner/progress | admin | 422 | true | application/json | 
GET | /api/learner/progress | unauth | 401 | true | application/json | 
GET | /api/learning-paths | admin | 200 | true | application/json | 
GET | /api/learning-paths | unauth | 401 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4 | admin | 200 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4 | unauth | 401 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/courses | admin | 200 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/courses | unauth | 401 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/enrollments | admin | 200 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/enrollments | unauth | 401 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/sections | admin | 200 | true | application/json | 
GET | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/sections | unauth | 401 | true | application/json | 
GET | /api/me | admin | 200 | true | application/json | 
GET | /api/me | unauth | 401 | true | application/json | 
GET | /api/notifications | admin | 200 | true | application/json | 
GET | /api/notifications | unauth | 401 | true | application/json | 
GET | /api/reports/course-progress | admin | 200 | true | application/json | 
GET | /api/reports/course-progress | unauth | 401 | true | application/json | 
GET | /api/reports/dashboard | admin | 200 | true | application/json | 
GET | /api/reports/dashboard | unauth | 401 | true | application/json | 
GET | /api/reports/overview | admin | 200 | true | application/json | 
GET | /api/reports/overview | unauth | 401 | true | application/json | 
GET | /api/reports/timeline | admin | 200 | true | application/json | 
GET | /api/reports/timeline | unauth | 401 | true | application/json | 
GET | /api/reports/training-matrix | admin | 200 | true | application/json | 
GET | /api/reports/training-matrix | unauth | 401 | true | application/json | 
GET | /api/reports/user-activity | admin | 200 | true | application/json | 
GET | /api/reports/user-activity | unauth | 401 | true | application/json | 
GET | /api/skills | admin | 200 | true | application/json | 
GET | /api/skills | unauth | 401 | true | application/json | 
GET | /api/submissions | admin | 200 | true | application/json | 
GET | /api/submissions | unauth | 401 | true | application/json | 
GET | /api/users | admin | 200 | true | application/json | 
GET | /api/users | unauth | 401 | true | application/json | 
GET | /api/users/search | admin | 200 | true | application/json | 
GET | /api/users/search | unauth | 401 | true | application/json | 
GET | /health | admin | 200 | true | application/json | 
GET | /health | unauth | 200 | true | application/json | 
PATCH | /api/automations | unauth | 401 | true | application/json | 
PATCH | /api/branches/a56fa416-4eaf-4a46-8153-52f4eb6d2d94 | unauth | 401 | true | application/json | 
PATCH | /api/courses | unauth | 401 | true | application/json | 
PATCH | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4 | unauth | 401 | true | application/json | 
PATCH | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/courses/reorder | unauth | 401 | true | application/json | 
PATCH | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/sections/00000000-0000-0000-0000-000000000000 | unauth | 401 | true | application/json | 
PATCH | /api/users | unauth | 401 | true | application/json | 
POST | /api/admin/notifications | unauth | 401 | true | application/json | 
POST | /api/admin/notifications/pending/00000000-0000-0000-0000-000000000000/cancel | unauth | 401 | true | application/json | 
POST | /api/admin/settings | unauth | 401 | true | application/json | 
POST | /api/admin/users/import | unauth | 401 | true | application/json | 
POST | /api/assignments | unauth | 401 | true | application/json | 
POST | /api/assignments/98c60659-4c53-4a50-b9c4-4a555fd79093/submissions | unauth | 401 | true | application/json | 
POST | /api/auth/forgot-password | unauth | 422 | true | application/json | 
POST | /api/auth/login | unauth | 422 | true | application/json | 
POST | /api/auth/logout | unauth | 401 | true | application/json | 
POST | /api/auth/logout-all | unauth | 401 | true | application/json | 
POST | /api/auth/refresh | unauth | 401 | true | application/json | 
POST | /api/auth/reset-password | unauth | 422 | true | application/json | 
POST | /api/auth/signup | unauth | 422 | true | application/json | 
POST | /api/auth/switch-node | unauth | 401 | true | application/json | 
POST | /api/automations | unauth | 401 | true | application/json | 
POST | /api/branches | unauth | 401 | true | application/json | 
POST | /api/categories | unauth | 401 | true | application/json | 
POST | /api/conferences | unauth | 401 | true | application/json | 
POST | /api/courses | unauth | 401 | true | application/json | 
POST | /api/enrollments | unauth | 401 | true | application/json | 
POST | /api/groups | unauth | 401 | true | application/json | 
POST | /api/groups/ea0df3dd-33d2-4aa2-8456-14affc4cf825/courses | unauth | 401 | true | application/json | 
POST | /api/groups/ea0df3dd-33d2-4aa2-8456-14affc4cf825/members | unauth | 401 | true | application/json | 
POST | /api/instructor/calendar/events | unauth | 401 | true | application/json | 
POST | /api/instructor/conferences | unauth | 401 | true | application/json | 
POST | /api/instructor/groups | unauth | 401 | true | application/json | 
POST | /api/learner/progress/units/00000000-0000-0000-0000-000000000000/complete | unauth | 401 | true | application/json | 
POST | /api/learning-paths | unauth | 401 | true | application/json | 
POST | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/courses | unauth | 401 | true | application/json | 
POST | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/enrollments | unauth | 401 | true | application/json | 
POST | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/sections | unauth | 401 | true | application/json | 
POST | /api/me/switch-role | unauth | 401 | true | application/json | 
POST | /api/notifications/mark-all-read | unauth | 401 | true | application/json | 
POST | /api/notifications/mark-read | unauth | 401 | true | application/json | 
POST | /api/reports/export/training-matrix | unauth | 401 | true | application/json | 
POST | /api/reports/export/training-progress | unauth | 401 | true | application/json | 
POST | /api/reports/generate | unauth | 401 | true | application/json | 
POST | /api/skills | unauth | 401 | true | application/json | 
POST | /api/submissions | unauth | 401 | true | application/json | 
POST | /api/upload | unauth | 401 | true | application/json | 
POST | /api/users | unauth | 401 | true | application/json | 
PUT | /api/admin/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4/options | unauth | 401 | true | application/json | 
PUT | /api/assignments/98c60659-4c53-4a50-b9c4-4a555fd79093 | unauth | 401 | true | application/json | 
PUT | /api/branches/a56fa416-4eaf-4a46-8153-52f4eb6d2d94 | unauth | 401 | true | application/json | 
PUT | /api/categories/97e8d5f6-86a9-4b88-a082-4f297805ac74 | unauth | 401 | true | application/json | 
PUT | /api/groups/ea0df3dd-33d2-4aa2-8456-14affc4cf825 | unauth | 401 | true | application/json | 
PUT | /api/learning-paths/b2d71eba-6e2f-45b2-bed5-08be4f7aaeb4 | unauth | 401 | true | application/json | 
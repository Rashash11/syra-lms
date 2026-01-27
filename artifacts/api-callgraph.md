# API Call Graph

- Generated: 2026-01-25T11:01:48.118Z
- Backend: http://127.0.0.1:8001
- Callsites: 230
- Unique calls: 108
- Matched unique calls: 87
- Unmatched unique calls: 21
- Backend routes (OpenAPI): 166
- Unused backend routes (sampled): 76

## Unmatched Calls (sample)

| Method | Path | File | Line |
|---|---|---|---:|
| GET | /api/instructor/learning-paths | apps/web/src/app/(instructor)/instructor/learning-paths/page.tsx | 53 |
| GET | /api/reports | apps/web/src/app/(instructor)/instructor/reports/page.tsx | 29 |
| GET | /api/instructor/job-roles | apps/web/src/app/(instructor)/instructor/skills/page.tsx | 101 |
| GET | /api/instructor/skills | apps/web/src/app/(instructor)/instructor/skills/page.tsx | 85 |
| GET | /api/instructor/recommendations/candidates | apps/web/src/app/(instructor)/instructor/skills/page.tsx | 124 |
| GET | /api/instructor/skills/{param1} | apps/web/src/app/(instructor)/instructor/skills/[id]/page.tsx | 43 |
| PUT | /api/submissions | apps/web/src/app/(learner)/learner/assignments/[id]/page.tsx | 184 |
| POST | /api/courses/{param1}/enroll | apps/web/src/app/(learner)/learner/catalog/page.tsx | 94 |
| PATCH | /api/courses/{param1} | apps/web/src/app/(super-instructor)/super-instructor/courses/new/page.tsx | 444 |
| PATCH | /api/courses/{param1}/units/{param2} | apps/web/src/app/(super-instructor)/super-instructor/courses/new/page.tsx | 531 |
| POST | /api/courses/{param1}/files | apps/web/src/app/(super-instructor)/super-instructor/courses/new/page.tsx | 638 |
| POST | /api/courses/{param1}/generate-image | apps/web/src/app/(super-instructor)/super-instructor/courses/new/page.tsx | 702 |
| PATCH | /api/submissions | apps/web/src/app/(super-instructor)/super-instructor/grading-hub/[id]/page.tsx | 90 |
| DELETE | /api/learning-paths/{param1}/courses | apps/web/src/app/(super-instructor)/super-instructor/learning-paths/[id]/edit/page-new.tsx | 187 |
| GET | /api/super-instructor/dashboard | apps/web/src/app/(super-instructor)/super-instructor/page.tsx | 110 |
| PATCH | /api/admin/learning-paths/{param1}/options | apps/web/src/app/admin/learning-paths/[id]/edit/components/LearningPathOptionsPanel.tsx | 114 |
| GET | /api/organization-nodes | apps/web/src/app/admin/users/new/page.tsx | 117 |
| POST | /api/courses/enroll/{param1} | apps/web/src/app/enroll/[key]/EnrollmentForm.tsx | 24 |
| POST | /api/courses/{param1}/enrollment-requests/{param2} | apps/web/src/modules/courses/editor/CourseEnrollmentDrawer.tsx | 282 |
| DELETE | /api/courses/{param1}/enrollment-requests/{param2} | apps/web/src/modules/courses/editor/CourseEnrollmentDrawer.tsx | 298 |
| GET | /api/reports/timeline | apps/web/src/modules/reports/ui/TimelineTab.tsx | 54 |

## Unused Backend Routes (sample)

| Method | Path |
|---|---|
| GET | /health |
| GET | /api/health |
| POST | /api/auth/login |
| POST | /api/auth/logout-all |
| POST | /api/auth/switch-node |
| POST | /api/auth/refresh |
| POST | /api/auth/reset-password |
| POST | /api/me/switch-role |
| GET | /api/courses/{course_id}/units |
| GET | /api/courses/{course_id}/sections |
| PUT | /api/courses/{course_id}/sections/{section_id} |
| DELETE | /api/courses/{course_id}/sections/{section_id} |
| DELETE | /api/users |
| PATCH | /api/users |
| DELETE | /api/courses |
| PATCH | /api/courses |
| GET | /api/enrollments |
| POST | /api/enrollments |
| DELETE | /api/enrollments/{enrollment_id} |
| DELETE | /api/groups |
| GET | /api/groups/{group_id} |
| PUT | /api/groups/{group_id} |
| POST | /api/groups/{group_id}/members |
| POST | /api/groups/{group_id}/courses |
| GET | /api/categories |
| POST | /api/categories |
| DELETE | /api/categories |
| GET | /api/categories/{category_id} |
| PUT | /api/categories/{category_id} |
| POST | /api/branches |
| DELETE | /api/branches |
| GET | /api/branches/{branch_id} |
| PATCH | /api/branches/{branch_id} |
| PUT | /api/branches/{branch_id} |
| GET | /api/certificates |
| PUT | /api/learning-paths/{path_id} |
| GET | /api/learning-paths/{path_id}/courses |
| DELETE | /api/learning-paths/{path_id}/courses/{course_id} |
| GET | /api/learning-paths/{path_id}/sections |
| POST | /api/assignments |
| PUT | /api/assignments/{assignment_id} |
| GET | /api/notifications |
| POST | /api/notifications/mark-read |
| POST | /api/notifications/mark-all-read |
| GET | /api/notifications/{notification_id} |
| DELETE | /api/notifications/{notification_id} |
| GET | /api/reports/dashboard |
| GET | /api/reports/course-progress |
| POST | /api/reports/generate |
| GET | /api/reports/user-activity |
| GET | /api/dashboard |
| GET | /api/admin/settings |
| POST | /api/admin/settings |
| GET | /api/admin/users/export |
| GET | /api/admin/user-types |
| POST | /api/admin/users/import |
| POST | /api/admin/users/{user_id}/impersonate |
| POST | /api/admin/notifications |
| GET | /api/admin/notifications/{notification_id} |
| PUT | /api/admin/notifications/{notification_id} |

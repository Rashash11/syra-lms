# Complete Database & API Analysis - SYRA LMS

## Executive Summary

This LMS has **94 database tables** with a comprehensive multi-tenant architecture supporting full learning management capabilities including courses, enrollments, assessments, gamification, messaging, reporting, and more.

---

## 📊 Database Overview

### Total Tables: 94

### Core Architecture

**Multi-Tenancy:**
- `tenants` - Main tenant/organization table
- `branches` - Sub-organizations within tenants (nodes)
- Tenant isolation enforced across all tables via `tenantId`

**Authentication & Authorization:**
- `users` - User accounts with multi-role support
- `user_roles` - User role assignments
- `auth_role` - Global role definitions (ADMIN, INSTRUCTOR, LEARNER, SUPER_INSTRUCTOR)
- `auth_permission` - Permission definitions
- `auth_role_permission` - Role-permission mappings
- `auth_audit_log` - Security audit trail
- `password_reset_tokens` - Password reset functionality
- `user_types` - Custom user type definitions

---

## 🎓 Learning Management Tables

### Courses (9 tables)
1. **courses** - Main course table
   - Fields: title, description, status, code, capacity, timeLimit, expiration
   - Supports: versioning, pricing, enrollment keys, thumbnails
   
2. **course_sections** - Course organization into sections
   - Drip content support (dripEnabled, dripType, dripValue)
   
3. **course_units** - Individual learning units
   - Types: TEXT, FILE, EMBED, VIDEO, TEST, SURVEY, ASSIGNMENT, ILT, SCORM, XAPI, etc.
   - Status: DRAFT, PUBLISHED, UNPUBLISHED_CHANGES
   
4. **course_versions** - Course version history
5. **course_files** - Course-attached files
6. **course_instructors** - Instructor assignments
7. **course_skills** - Skills associated with courses
8. **course_ratings** - Student course ratings
9. **course_rating_settings** - Rating configuration

### Enrollments (4 tables)
1. **enrollments** - Student course enrollments
   - Status: NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED, EXPIRED
   - Tracks: progress, score, startedAt, completedAt, expiresAt
   
2. **enrollment_requests** - Enrollment approval workflow
3. **enrollment_extensions** - Deadline extensions
4. **learner_course_state** - Last accessed unit tracking

### Learning Paths (5 tables)
1. **learning_paths** - Curated course sequences
   - Supports: sequential/any order, completion rules, certificates
   
2. **learning_path_courses** - Courses in paths
3. **learning_path_sections** - Path organization
4. **learning_path_enrollments** - User path enrollments
5. **learning_path_skills** - Skills in paths

### Prerequisites (1 table)
- **prerequisites** - Course prerequisites

---

## 📝 Assessment & Testing Tables (8 tables)

1. **tests** - Test/quiz definitions
   - Randomization, passing scores, question limits
   
2. **questions** - Test questions
   - Types: multiple choice, free text, etc.
   - AI-generated question support
   
3. **question_pools** - Question banks
4. **free_text_keywords** - Keyword-based grading
5. **test_attempts** - Student test submissions
6. **assignments** - Assignment definitions
7. **assignment_submissions** - Assignment submissions with grading
8. **ilt_sessions** - Instructor-Led Training sessions
9. **ilt_attendance** - ILT attendance tracking

---

## 🎯 Skills & Competencies (7 tables)

1. **skills** - Skill definitions
   - AI-powered skill assessments
   
2. **user_skills** - User skill levels
   - Levels: BEGINNER, INTERMEDIATE, ADVANCED
   
3. **skill_questions** - Skill assessment questions
4. **skill_recommendations** - Peer skill endorsements
5. **skill_resources** - Learning resources per skill
6. **job_roles** - Job role definitions
7. **role_skills** - Skills required for roles

---

## 👥 User Management (5 tables)

1. **users** - Main user table
   - Multi-role support (activeRole field)
   - Status: ACTIVE, INACTIVE, DEACTIVATED, LOCKED
   - RBAC overrides, node assignments
   
2. **user_roles** - Role assignments
3. **user_types** - Custom user types
4. **groups** - User groups
5. **group_members** - Group membership

---

## 📁 Content & Files (6 tables)

1. **files** - File storage
2. **file_visibility** - File access control
3. **unit_assets** - Unit-attached assets
4. **attachments** - Generic attachments
5. **upload_policies** - Upload restrictions
6. **scorm_data** - SCORM package data

---

## 💬 Communication (10 tables)

1. **message_threads** - Message conversations
2. **messages** - Individual messages
3. **message_recipients** - Message recipients
4. **messaging_permissions** - Messaging rules
5. **discussions** - Discussion forums
6. **discussion_comments** - Forum comments
7. **discussion_moderation_settings** - Moderation config
8. **notifications** - Notification templates
9. **notification_queue** - Scheduled notifications
10. **notification_history** - Sent notifications

---

## 🎮 Gamification (5 tables)

1. **gamification_settings** - Gamification config
2. **points_ledger** - Points transactions
3. **badges** - Badge definitions
4. **levels** - Level system
5. **rewards** - Reward definitions

---

## 📊 Reporting & Analytics (6 tables)

1. **reports** - Report definitions
2. **scheduled_reports** - Automated reports
3. **analytics_dashboards** - Custom dashboards
4. **report_exports** - Export jobs
5. **timeline_events** - Activity tracking
6. **lrs_statements** - xAPI/LRS statements

---

## 🎫 Certificates (2 tables)

1. **certificate_templates** - Certificate designs
2. **certificate_issues** - Issued certificates

---

## 📅 Calendar & Events (3 tables)

1. **calendar_events** - Calendar entries
2. **conferences** - Virtual meetings
3. **conference_participants** - Meeting attendees

---

## 🤖 Automation (2 tables)

1. **automations** - Automation rules
2. **automation_logs** - Automation execution logs

---

## 🏢 Organization (2 tables)

1. **categories** - Content categories
2. **branches** - Organizational nodes

---

## 🔗 Integrations (4 tables)

1. **integrations** - Third-party integrations
2. **api_keys** - API access keys
3. **sso_configs** - Single Sign-On configs
4. **impersonation_sessions** - Admin impersonation

---

## 📦 Content Library (2 tables)

1. **talent_library_courses** - External course library
2. **acquired_library_courses** - Purchased courses

---

## 📥 Import/Export (2 tables)

1. **import_jobs** - Bulk import jobs
2. **import_results** - Import results

---

## 🏠 Portal Customization (4 tables)

1. **homepages** - Homepage configurations
2. **homepage_sections** - Homepage sections
3. **portal_feature_flags** - Feature toggles
4. **categories** - Content categorization

---

## 🔐 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /logout-all` - Logout all sessions
- `GET /me` - Get current user
- `GET /permissions` - Get user permissions
- `POST /switch-node` - Switch branch/node
- `POST /signup` - User registration
- `POST /refresh` - Refresh JWT token
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Reset password

### Admin (`/api/admin`)
- `GET /roles` - List roles
- `GET /permissions` - List permissions
- `GET /settings` - Get portal settings
- `POST /settings` - Update settings
- `GET /security/audit` - Audit logs
- `GET /security/sessions` - Active sessions
- `DELETE /security/sessions` - Revoke sessions
- `GET /users/export` - Export users
- `GET /users/preview-permissions` - Preview permissions
- `GET /user-types` - List user types
- `POST /users/import` - Import users
- `POST /users/{user_id}/impersonate` - Impersonate user
- Notification management endpoints

### Users (`/api/users`)
- Full CRUD operations
- Bulk operations support
- Role management
- User activation/deactivation

### Courses (`/api/courses`)
- Full CRUD operations
- Course publishing workflow
- Section and unit management
- Instructor assignments
- Enrollment management

### Enrollments (`/api/enrollments`)
- Enroll users in courses
- Track progress
- Manage completions
- Extension requests

### Learning Paths (`/api/learning-paths`)
- Create and manage paths
- Course sequencing
- Path enrollments
- Progress tracking

### Assignments (`/api/assignments`)
- Create assignments
- Submit assignments
- Grade submissions
- View submissions

### Submissions (`/api/submissions`)
- List submissions
- Grade submissions
- Provide feedback

### Skills (`/api/skills`)
- Skill management
- Skill assessments
- Skill recommendations

### Groups (`/api/groups`)
- Group management
- Member management
- Course assignments

### Categories (`/api/categories`)
- Category CRUD
- Hierarchical categories

### Branches (`/api/branches`)
- Branch management
- Branch settings
- Bulk operations

### Files (`/api/files`)
- File upload
- File download
- File deletion
- Access control

### Uploads (`/api/upload`)
- Multi-file upload
- File validation

### Calendar Events (`/api/calendar-events`)
- Event management
- Scheduling

### Conferences (`/api/conferences`)
- Virtual meeting management
- Participant management

### Automations (`/api/automations`)
- Automation rules
- Bulk operations

### Catalog (`/api/catalog`)
- Browse available courses
- Public course listings

### Certificates (`/api/certificates`)
- Certificate generation
- Certificate download

### Reports (`/api/reports`)
- Generate reports
- Export data
- Scheduled reports

### Notifications (`/api/notifications`)
- Notification management
- Notification templates

### Dashboard (`/api/dashboard`)
- Analytics data
- Statistics
- Activity summaries

### Instructor (`/api/instructor`)
- Instructor-specific endpoints
- Course management
- Student management

### Super Instructor (`/api/super-instructor`)
- Cross-branch management
- Advanced analytics

### Learner (`/api/learner`)
- Learner dashboard
- My courses
- My assignments
- My learning paths

### Me (`/api/me`)
- Current user profile
- Update profile
- Preferences

---

## 🔑 Key Features Identified

### 1. Multi-Tenancy
- Complete tenant isolation
- Branch/node hierarchy
- Tenant-specific settings

### 2. Role-Based Access Control (RBAC)
- 4 main roles: ADMIN, INSTRUCTOR, LEARNER, SUPER_INSTRUCTOR
- Granular permissions
- Role overrides per user
- Node-based access control

### 3. Content Management
- Multiple content types (video, text, SCORM, xAPI, ILT, etc.)
- Version control
- Drip content
- Content locking

### 4. Assessment Engine
- Multiple question types
- AI-generated questions
- Randomized tests
- Keyword-based grading
- Assignment submissions with grading

### 5. Learning Paths
- Sequential or flexible ordering
- Prerequisites
- Completion rules
- Certificates

### 6. Skills Framework
- Skill definitions
- Skill assessments
- Skill levels (Beginner, Intermediate, Advanced)
- Job role mapping
- Peer recommendations

### 7. Gamification
- Points system
- Badges
- Levels
- Rewards
- Leaderboards

### 8. Communication
- Messaging system
- Discussion forums
- Notifications
- Email integration

### 9. Reporting & Analytics
- Custom reports
- Scheduled reports
- Analytics dashboards
- Timeline tracking
- xAPI/LRS support

### 10. Integrations
- SSO support
- API keys
- Third-party integrations
- Content library

### 11. Automation
- Rule-based automation
- Bulk operations
- Scheduled tasks

### 12. Certificates
- Custom templates
- Automatic issuance
- LinkedIn sharing

---

## 📈 Database Statistics

**Total Tables:** 94
**Enums:** 11
- UserStatus, RoleKey, CourseStatus, EnrollmentStatus
- UnitType, UnitStatus, UnlockType, CourseOrderMode
- CompletionRule, CertificateType, SkillLevel, AudienceType

**Key Relationships:**
- Tenant → All entities (cascade delete)
- User → Multiple roles
- Course → Sections → Units
- Learning Path → Courses
- Skills → Courses, Learning Paths, Users

**Soft Deletes:** Many tables include `deletedAt` field

**Audit Trail:** `createdAt`, `updatedAt` on most tables

---

## 🎯 Conclusion

This is a **production-grade, enterprise LMS** with:
- ✅ Complete multi-tenancy
- ✅ Comprehensive RBAC
- ✅ Full course lifecycle management
- ✅ Advanced assessment engine
- ✅ Skills & competency tracking
- ✅ Gamification
- ✅ Communication tools
- ✅ Reporting & analytics
- ✅ Integration capabilities
- ✅ Automation features

The system rivals commercial LMS platforms like TalentLMS, Moodle, and Canvas in terms of features and capabilities.

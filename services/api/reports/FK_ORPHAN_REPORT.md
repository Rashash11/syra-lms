# FK Orphan & Tenant Mismatch Audit
TOTAL_PASS: 12
TOTAL_FAIL: 0

## group_members -> groups [PASS]
- FK constraints on child: 1
- Orphan count: 0
- Cross-tenant mismatch count: 0

## group_members -> users [PASS]
- FK constraints on child: 1
- Orphan count: 0
- Cross-tenant mismatch count: 0

## group_courses -> groups [PASS]
- FK constraints on child: 2
- Orphan count: 0
- Cross-tenant mismatch count: 0

## group_courses -> courses [PASS]
- FK constraints on child: 2
- Orphan count: 0
- Cross-tenant mismatch count: 0

## enrollments -> users [PASS]
- FK constraints on child: 3
- Orphan count: 0
- Cross-tenant mismatch count: 0

## enrollments -> courses [PASS]
- FK constraints on child: 3
- Orphan count: 0
- Cross-tenant mismatch count: 0

## learning_path_enrollments -> users [PASS]
- FK constraints on child: 3
- Orphan count: 0
- Cross-tenant mismatch count: 0

## learning_path_enrollments -> learning_paths [PASS]
- FK constraints on child: 3
- Orphan count: 0
- Cross-tenant mismatch count: 0

## password_reset_tokens -> users [PASS]
- FK constraints on child: 2
- Orphan count: 0
- Cross-tenant mismatch count: 0

## points_ledger -> users [PASS]
- FK constraints on child: 1
- Orphan count: 0
- Cross-tenant mismatch count: 0

## scorm_data -> course_units [PASS]
- FK constraints on child: 1
- Orphan count: 0
- Cross-tenant mismatch count: 0

## conference_participants -> users [PASS]
- FK constraints on child: 1
- Orphan count: 0
- Cross-tenant mismatch count: 0

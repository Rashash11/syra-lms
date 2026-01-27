export const ALL_PERMISSIONS: readonly string[] = [
  'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete', 'course:delete_any',
  'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete',
  'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
  'group:read', 'group:create', 'group:update', 'group:delete',
  'user:read', 'user:create', 'user:update', 'user:delete',
  'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
  'submission:read', 'submission:create', 'submission:grade', 'submission:publish', 'submission:download',
  'reports:read', 'reports:export',
  'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
  'conference:read', 'conference:create', 'conference:update', 'conference:delete',
  'skills:read', 'skills:update', 'skills:create', 'skills:delete',
  'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
  'certificate:issue:read', 'certificate:view_own',
  'notifications:read', 'automations:read',
  'branches:read',
  'security:sessions:read', 'security:sessions:revoke', 'security:audit:read'
];

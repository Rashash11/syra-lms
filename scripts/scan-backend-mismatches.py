#!/usr/bin/env python3
"""
Scan all backend Python files for SQL table/column mismatches with Prisma schema.
"""

import re
import os
from pathlib import Path

# Prisma model to actual table name mappings
TABLE_MAPPINGS = {
    "User": "users",
    "Tenant": "tenants",
    "Branch": "branches",
    "Course": "courses",
    "CourseSection": "course_sections",
    "CourseUnit": "course_units",
    "Enrollment": "enrollments",
    "Group": "groups",
    "LearningPath": "learning_paths",
    "Notification": "notifications",
    "Assignment": "assignments",
    "Category": "categories",
    "AuthRole": "auth_role",
    "AuthPermission": "auth_permission",
    "UserRole": "user_roles",
}

# Common column name issues
COLUMN_MAPPINGS = {
    "is_active": "is_active",  # Correct
    "node_id": "node_id",  # Correct
    "token_version": "token_version",  # Correct
}

def scan_file(filepath):
    """Scan a Python file for potential SQL issues."""
    issues = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
        # Look for FROM "CapitalizedTable"
        for model, table in TABLE_MAPPINGS.items():
            # Check for FROM "Model" that should be FROM "table"
            pattern = rf'FROM\s+"({model})"'
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    issues.append({
                        'file': filepath,
                        'line': i,
                        'issue': f'Found FROM "{model}" - should be FROM "{table}"',
                        'code': line.strip()
                    })
                    
            # Check for UPDATE "Model"
            pattern = rf'UPDATE\s+"({model})"'
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    issues.append({
                        'file': filepath,
                        'line': i,
                        'issue': f'Found UPDATE "{model}" - should be UPDATE "{table}"',
                        'code': line.strip()
                    })
                    
            # Check for INSERT INTO "Model"
            pattern = rf'INSERT\s+INTO\s+"({model})"'
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    issues.append({
                        'file': filepath,
                        'line': i,
                        'issue': f'Found INSERT INTO "{model}" - should be INSERT INTO "{table}"',
                        'code': line.strip()
                    })
    
    except Exception as e:
        issues.append({
            'file': filepath,
            'line': 0,
            'issue': f'Error reading file: {e}',
            'code': ''
        })
    
    return issues

def main():
    print("=" * 80)
    print("SCANNING BACKEND FOR SQL TABLE/COLUMN MISMATCHES")
    print("=" * 80)
    print()
    
    api_dir = Path("e:/lms/services/api/app")
    all_issues = []
    
    # Scan all Python files
    for py_file in api_dir.rglob("*.py"):
        issues = scan_file(str(py_file))
        if issues:
            all_issues.extend(issues)
    
    if all_issues:
        print(f"FOUND {len(all_issues)} POTENTIAL ISSUES:\n")
        for issue in all_issues:
            rel_path = Path(issue['file']).relative_to("e:/lms/services/api")
            print(f"📍 {rel_path}:{issue['line']}")
            print(f"   ⚠️  {issue['issue']}")
            print(f"   📝 {issue['code'][:100]}")
            print()
    else:
        print("✅ NO ISSUES FOUND!")
        print("All table references appear to match Prisma schema mappings.")
    
    print("=" * 80)

if __name__ == "__main__":
    main()

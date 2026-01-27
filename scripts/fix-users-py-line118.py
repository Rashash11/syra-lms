#!/usr/bin/env python3
"""Fix the syntax error on line 118 of users.py"""

import sys

file_path = r'e:\lms\services\api\app\routes\users.py'

print(f"Fixing syntax error in {file_path}...")

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Line 118 is index 117 (0-indexed)
    # The problematic line is:
    # f'FROM users {where_clause.replace(\"\\\\\"\", \"\\\"\\\"\")} ORDER BY \"createdAt\" DESC OFFSET :offset LIMIT :limit'
    
    # Replace it with a corrected version
    target_idx = None
    for i, line in enumerate(lines):
        if 'FROM users {where_clause.replace' in line and i > 100 and i < 130:
            target_idx = i
            print(f"Found problematic line at index {i} (line {i+1})")
            print(f"Original: {line[:80]}...")
            break
    
    if target_idx is None:
        print("Could not find the problematic line!")
        sys.exit(1)
    
    # Insert a helper variable before the SQL construction
    indent = '            '
    # Find the line with list_sql_lower assignment
    sql_line_idx = target_idx - 1
    while sql_line_idx > 0:
        if 'list_sql_lower' in lines[sql_line_idx]:
            break
        sql_line_idx -= 1
    
    #  Insert helper lines before the list_sql_lower
    new_lines = lines[:sql_line_idx]
    new_lines.append(indent + '# Remove quotes from where clause for lowercase table\n')
    new_lines.append(indent + 'where_lower = where_clause.replace(\'"\', \'\') if where_clause else ""\n')
    new_lines.append(indent + 'list_sql_lower = (\n')
    new_lines.append(indent + '    \'SELECT id,username,email,"firstName","lastName",status,"activeRole","is_active","node_id","createdAt" \'\n')
    new_lines.append(indent + '    f\'FROM users {where_lower} ORDER BY "createdAt" DESC OFFSET :offset LIMIT :limit\'\n')
    new_lines.append(indent + ')\n')
    
    # Skip the old problematic lines (sql_line_idx to target_idx+1)
    new_lines.extend(lines[target_idx+1:])
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("✓ Fixed successfully!")
    print("Backend should now start without syntax errors.")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

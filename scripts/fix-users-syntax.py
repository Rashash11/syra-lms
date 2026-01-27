# Fix the users.py syntax error
import re

# Read the file
with open(r'e:\lms\services\api\app\routes\users.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 118 - replace the problematic string
# Original: f'FROM users {where_clause.replace(\"\\\\\"\", \"\\\"\\\"\")} ORDER BY \"createdAt\" DESC OFFSET :offset LIMIT :limit'
# Fixed: simpler approach without complex escaping

# Find and replace the problematic section
old_section = '''    # Fallback to lowercase table "users" if Prisma table missing/empty
    if not rows:
        try:
            list_sql_lower = (
                'SELECT id,username,email,"firstName","lastName",status,"activeRole","is_active","node_id","createdAt" '
                f'FROM users {where_clause.replace(\"\\\\\"\", \"\\\"\\\"\")} ORDER by \"createdAt\" DESC OFFSET :offset LIMIT :limit'
            )'''

new_section = '''    # Fallback to lowercase table "users" if Prisma table missing/empty
    if not rows:
        try:
            # For lowercase table, simplify where clause
            where_lower = where_clause.replace('"', '') if where_clause else ""
            list_sql_lower = (
                'SELECT id,username,email,"firstName","lastName",status,"activeRole","is_active","node_id","createdAt" '
                f'FROM users {where_lower} ORDER BY "createdAt" DESC OFFSET :offset LIMIT :limit'
            )'''

# Simple replacement - find the line with the error and fix it
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'FROM users {where_clause.replace' in line and 'ORDER BY' in line:
        # Replace this problematic line
        # Split into parts
        indent = '                '
        lines[i-1] = indent + '# For lowercase table, simplify where clause'
        lines.insert(i, indent + 'where_lower = where_clause.replace(\'"\',' '') if where_clause else ""')
        lines[i+1] = indent + 'list_sql_lower = ('
        lines[i+2] = indent + '    \'SELECT id,username,email,"firstName","lastName",status,"activeRole","is_active","node_id","createdAt" \''
        lines[i+3] = indent + '    f\'FROM users {where_lower} ORDER BY "createdAt" DESC OFFSET :offset LIMIT :limit\''
        lines[i+4] = indent + ')'
        break

# Write back
with open(r'e:\lms\services\api\app\routes\users.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("Fixed!")

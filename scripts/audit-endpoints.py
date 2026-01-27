# Endpoint Audit Script
# Scans FastAPI routes and frontend API calls to find mismatches

import os
import re
from pathlib import Path

print("=== FASTAPI ENDPOINTS ===\n")

# Scan FastAPI routes
api_routes_dir = Path("E:/lms/services/api/app/routes")
fastapi_endpoints = set()

for py_file in api_routes_dir.glob("*.py"):
    with open(py_file, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find @router.get, @router.post, etc.
        matches = re.findall(r'@router\.(get|post|put|patch|delete)\(["\']([^"\']+)', content)
        for method, path in matches:
            fastapi_endpoints.add(f"{method.upper()} {path}")

# Check main.py for prefixes
main_file = Path("E:/lms/services/api/app/main.py")
with open(main_file, 'r', encoding='utf-8') as f:
    main_content = f.read()
    prefixes = re.findall(r'app\.include_router\([^,]+,\s*prefix=["\']([^"\']+)', main_content)

print(f"Found {len(prefixes)} route prefixes:")
for prefix in sorted(set(prefixes)):
    print(f"  {prefix}")

print(f"\nFound {len(fastapi_endpoints)} endpoint definitions\n")

print("\n=== FRONTEND API CALLS ===\n")

# Scan frontend for API calls
frontend_dir = Path("E:/lms/apps/web/src")
frontend_calls = set()

for ts_file in frontend_dir.rglob("*.tsx"):
    try:
        with open(ts_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Find apiFetch, fetch, axios calls with /api/
            calls = re.findall(r'(?:apiFetch|fetch|axios).*?["\']([/]api/[^"\']+)', content)
            for call in calls:
                frontend_calls.add(call)
    except:
        pass

for ts_file in frontend_dir.rglob("*.ts"):
    try:
        with open(ts_file, 'r', encoding='utf-8') as f:
            content = f.read()
            calls = re.findall(r'(?:apiFetch|fetch|axios).*?["\']([/]api/[^"\']+)', content)
            for call in calls:
                frontend_calls.add(call)
    except:
        pass

print(f"Found {len(frontend_calls)} unique API calls:")
for call in sorted(frontend_calls)[:30]:  # Show first 30
    print(f"  {call}")

if len(frontend_calls) > 30:
    print(f"  ... and {len(frontend_calls) - 30} more")

print("\n=== MISMATCHES ===\n")

# Look for obvious mismatches
mismatches = []
for call in frontend_calls:
    # Remove :id, :path*, etc. for comparison
    call_clean = re.sub(r'\$\{[^}]+\}', ':id', call)
    call_clean = re.sub(r'/[a-f0-9-]{36}', '/:id', call_clean)
    
    # Check if this path exists in any FastAPI route
    found = False
    for prefix in prefixes:
        if call.startswith(prefix):
            found = True
            break
    
    if not found and '/api/' in call:
        # Special check for common patterns
        if call == '/api/dashboard' or call.startswith('/api/dashboard/'):
            mismatches.append(f"MISSING: {call} (should be /api/reports/dashboard)")

print(f"Identified {len(mismatches)} potential mismatches:")
for mismatch in mismatches[:20]:
    print(f"  {mismatch}")

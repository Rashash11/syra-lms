#!/usr/bin/env bash
set -euo pipefail

echo "== GET smoke =="
python scripts/smoke_runner.py

echo "== WRITE smoke =="
python scripts/write_smoke_runner.py

echo "== Tenant isolation audit =="
python scripts/tenant_isolation_audit.py

echo "== RBAC audit =="
python scripts/rbac_audit.py

echo "== Schema drift check =="
python scripts/schema_drift_check.py

echo "== FK orphan audit =="
python scripts/fk_orphan_audit.py

echo "== Query plan audit =="
python scripts/query_plan_audit.py

echo "All verifications PASSED"

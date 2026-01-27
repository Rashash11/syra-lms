import asyncio
import os
import sys
from typing import Any, Dict, List

from sqlalchemy import text

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.db.session import engine

RELATIONS = [
    # (child, parent, child_fk_col, parent_pk_col)
    ("group_members", "groups", '"groupId"', "id"),
    ("group_members", "users", '"userId"', "id"),
    ("group_courses", "groups", '"groupId"', "id"),
    ("group_courses", "courses", '"courseId"', "id"),
    ("enrollments", "users", '"userId"', "id"),
    ("enrollments", "courses", '"courseId"', "id"),
    ("learning_path_enrollments", "users", '"userId"', "id"),
    ("learning_path_enrollments", "learning_paths", '"pathId"', "id"),
    ("password_reset_tokens", "users", '"userId"', "id"),
    ("points_ledger", "users", '"userId"', "id"),
    ("scorm_data", "course_units", '"unitId"', "id"),
    ("conference_participants", "users", '"userId"', "id"),
]


async def table_exists(conn, table: str) -> bool:
    res = await conn.execute(text("SELECT to_regclass('public.' || :t)"), {"t": table})
    return res.scalar() is not None


async def has_fk(conn, child: str) -> int:
    res = await conn.execute(
        text("""
        SELECT COUNT(*) FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.contype='f' AND n.nspname='public' AND t.relname=:child
    """),
        {"child": child},
    )
    return int(res.scalar() or 0)


async def audit_relation(
    conn, child: str, parent: str, child_fk_col: str, parent_pk_col: str
) -> Dict[str, Any]:
    if not await table_exists(conn, child) or not await table_exists(conn, parent):
        return {
            "child": child,
            "parent": parent,
            "status": "SKIP",
            "reason": "Missing table",
        }

    orphan_sql = f"""
        SELECT c.id, c.{child_fk_col} AS fk
        FROM {child} c
        LEFT JOIN {parent} p ON p.{parent_pk_col} = c.{child_fk_col}
        WHERE p.{parent_pk_col} IS NULL
        LIMIT 5
    """
    mismatch_sql = f"""
        SELECT COUNT(*) FROM {child} c
        JOIN {parent} p ON p.{parent_pk_col} = c.{child_fk_col}
        WHERE c."tenantId" IS NOT NULL AND p."tenantId" IS NOT NULL AND c."tenantId" <> p."tenantId"
    """
    orphan_sample = await conn.execute(text(orphan_sql))
    orphan_rows = orphan_sample.fetchall()
    mismatch_count = await conn.execute(text(mismatch_sql))
    mismatch = int(mismatch_count.scalar() or 0)
    fk_count = await has_fk(conn, child)

    status = "PASS"
    if orphan_rows or mismatch:
        status = "FAIL"

    return {
        "child": child,
        "parent": parent,
        "status": status,
        "orphan_count": len(orphan_rows),
        "orphan_sample": [(str(r[0]), str(r[1])) for r in orphan_rows],
        "mismatch_count": mismatch,
        "fk_constraints": fk_count,
        "orphan_sql": orphan_sql.strip(),
        "mismatch_sql": mismatch_sql.strip(),
        "recommendation": (
            "Add FK and cleanup" if (fk_count == 0 or orphan_rows or mismatch) else "OK"
        ),
    }


async def run_audit() -> None:
    async with engine.begin() as conn:
        results: List[Dict[str, Any]] = []
        for child, parent, fk_col, pk_col in RELATIONS:
            res = await audit_relation(conn, child, parent, fk_col, pk_col)
            results.append(res)

        pass_count = sum(1 for r in results if r["status"] == "PASS")
        fail_count = sum(1 for r in results if r["status"] == "FAIL")

        # Write report
        out_dir = os.path.join(API_ROOT, "reports")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "FK_ORPHAN_REPORT.md")
        lines: List[str] = []
        lines.append("# FK Orphan & Tenant Mismatch Audit")
        lines.append(f"TOTAL_PASS: {pass_count}")
        lines.append(f"TOTAL_FAIL: {fail_count}\n")

        for r in results:
            lines.append(f"## {r['child']} -> {r['parent']} [{r['status']}]")
            lines.append(f"- FK constraints on child: {r['fk_constraints']}")
            lines.append(f"- Orphan count: {r.get('orphan_count', 0)}")
            if r.get("orphan_sample"):
                lines.append(f"- Orphan sample (id,fk): {r['orphan_sample']}")
            lines.append(f"- Cross-tenant mismatch count: {r.get('mismatch_count', 0)}")
            if r["status"] == "FAIL":
                lines.append("- SQL (orphan):")
                lines.append(f"```sql\n{r['orphan_sql']}\n```")
                lines.append("- SQL (mismatch):")
                lines.append(f"```sql\n{r['mismatch_sql']}\n```")
                lines.append(f"- Recommendation: {r['recommendation']}")
            lines.append("")

        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"FK orphan audit written to {out_path}")


if __name__ == "__main__":
    asyncio.run(run_audit())

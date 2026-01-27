import asyncio
import os
import sys
from typing import Any, List, Tuple

from sqlalchemy import text

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.db.models import Course, Group, Tenant
from app.db.session import async_session_factory, engine

QUERIES: List[Tuple[str, str]] = [
    (
        "Users list",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM users WHERE "tenantId" = :t AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20""",
    ),
    (
        "Courses list",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM courses WHERE "tenantId" = :t AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20""",
    ),
    (
        "Groups list",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM groups WHERE "tenantId" = :t AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 20""",
    ),
    (
        "Group detail",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM groups WHERE id = :gid AND "tenantId" = :t AND "deletedAt" IS NULL""",
    ),
    (
        "Course enrollments",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM enrollments WHERE "courseId" = :cid AND "tenantId" = :t ORDER BY "updatedAt" DESC LIMIT 20""",
    ),
    (
        "Learning paths list",
        """EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM learning_paths WHERE "tenantId" = :t ORDER BY "createdAt" DESC LIMIT 50""",
    ),
]


async def pick_ids() -> Tuple[Any, Any, Any]:
    async with async_session_factory() as session:
        t_res = await session.execute(text("SELECT id FROM tenants LIMIT 1"))
        t_id = t_res.scalar()
        c_res = await session.execute(
            text('SELECT id FROM courses WHERE "tenantId" = :t LIMIT 1'), {"t": t_id}
        )
        c_id = c_res.scalar()
        g_res = await session.execute(
            text('SELECT id FROM groups WHERE "tenantId" = :t LIMIT 1'), {"t": t_id}
        )
        g_id = g_res.scalar()
        return (t_id, c_id, g_id)


async def has_tenant_index(table: str) -> bool:
    async with engine.begin() as conn:
        res = await conn.execute(
            text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE schemaname='public' AND tablename=:t
        """),
            {"t": table},
        )
        idx = res.fetchall()
        for name, defn in idx:
            if '"tenantId"' in defn:
                return True
        return False


async def run_audit() -> None:
    t_id, c_id, g_id = await pick_ids()
    out_dir = os.path.join(API_ROOT, "reports")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "QUERY_PLAN_REPORT.md")
    lines: List[str] = []
    lines.append("# Query Plan Audit")
    lines.append("")
    async with engine.begin() as conn:
        for name, q in QUERIES:
            params = {"t": t_id, "cid": c_id, "gid": g_id}
            res = await conn.execute(text(q), params)
            plan_lines = [row[0] for row in res.fetchall()]
            lines.append(f"## {name}")
            lines.append("```")
            lines.extend(plan_lines[:40])  # cap to 40 lines
            lines.append("```")
            lines.append("")

    # Index presence summary
    checks = [
        ("users", await has_tenant_index("users")),
        ("courses", await has_tenant_index("courses")),
        ("groups", await has_tenant_index("groups")),
        ("enrollments", await has_tenant_index("enrollments")),
        ("learning_paths", await has_tenant_index("learning_paths")),
    ]
    lines.append("## Index Summary (tenantId presence)")
    for tbl, present in checks:
        lines.append(f"- {tbl}: {'YES' if present else 'NO'}")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Query plan report written to {out_path}")


if __name__ == "__main__":
    asyncio.run(run_audit())

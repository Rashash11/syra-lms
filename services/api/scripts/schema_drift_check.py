import asyncio
import os
import sys
from typing import Dict, List, Tuple

from sqlalchemy import text

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.db.models import Base
from app.db.session import async_session_factory, engine

TABLES = sorted(list(Base.metadata.tables.keys()))


async def get_db_columns(table: str) -> List[Tuple[str, str, str]]:
    async with engine.begin() as conn:
        res = await conn.execute(
            text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=:t
            ORDER BY ordinal_position
        """),
            {"t": table},
        )
        return [(r[0], r[1], r[2]) for r in res.fetchall()]


def get_sqla_columns(table: str) -> List[str]:
    tbl = Base.metadata.tables.get(table)
    if tbl is None:
        return []
    return [c.name for c in tbl.columns]


async def get_db_uniques(table: str) -> List[str]:
    async with engine.begin() as conn:
        res = await conn.execute(
            text("""
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.contype='u' AND n.nspname='public' AND t.relname=:t
        """),
            {"t": table},
        )
        return [r[0] for r in res.fetchall()]


async def generate_report() -> str:
    lines: List[str] = []
    lines.append("# Schema Drift Report")
    lines.append("")
    for table in TABLES:
        lines.append(f"## Table: {table}")
        db_cols = await get_db_columns(table)
        sqla_cols = get_sqla_columns(table)
        db_col_names = [c[0] for c in db_cols]
        missing_in_db = [c for c in sqla_cols if c not in db_col_names]
        extra_in_db = [c for c in db_col_names if c not in sqla_cols]
        lines.append(
            f"- SQLAlchemy columns ({len(sqla_cols)}): {', '.join(sqla_cols) or '(none)'}"
        )
        lines.append(
            f"- DB columns ({len(db_cols)}): {', '.join(db_col_names) or '(none)'}"
        )
        if missing_in_db:
            lines.append(f"- WARNING: Missing in DB: {', '.join(missing_in_db)}")
        if extra_in_db:
            lines.append(f"- NOTE: Extra in DB (not mapped): {', '.join(extra_in_db)}")
        uniques = await get_db_uniques(table)
        lines.append(f"- DB unique constraints: {', '.join(uniques) or '(none)'}")
        lines.append("")
    return "\n".join(lines)


async def main() -> None:
    report = await generate_report()
    out_dir = os.path.join(API_ROOT, "reports")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "DRIFT_REPORT.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"Drift report written to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())

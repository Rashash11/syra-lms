import asyncio
import os
import sys

from sqlalchemy import text

# Ensure repo root (services/api) is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.db.models import File, FileVisibility
from app.db.session import async_session_factory, engine


async def main() -> None:
    print("=== DB Existence Check ===")
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT to_regclass('public.file_visibility')"))
        print("to_regclass('public.file_visibility') =", res.scalar())
        for t in [
            "group_members",
            "group_courses",
            "course_sections",
            "password_reset_tokens",
            "points_ledger",
        ]:
            r = await conn.execute(text(f"SELECT to_regclass('public.{t}')"))
            print(f"to_regclass('public.{t}') =", r.scalar())

    print("=== ORM Relation Load Test ===")
    async with async_session_factory() as session:
        try:
            # Try selecting from the mapped table via ORM
            result = await session.execute(
                text('SELECT 1 FROM "file_visibility" LIMIT 1')
            )
            rows = result.fetchall()
            print("SELECT 1 from file_visibility OK; rows returned:", len(rows))
        except Exception as e:
            print("SELECT from file_visibility failed:", e)

        # Try loading a File and checking visibilities for it
        file_row = await session.execute(text('SELECT "id" FROM "files" LIMIT 1'))
        file_first = file_row.first()
        if file_first:
            file_id = file_first[0]
            vis = await session.execute(
                text('SELECT 1 FROM "file_visibility" WHERE "fileId" = :fid LIMIT 5'),
                {"fid": file_id},
            )
            print("Visibilities for first file:", len(vis.fetchall()))
        else:
            print("No files present; skipped per-file visibility check")

        # Minimal selects for updated mappings
        for t in [
            "group_members",
            "group_courses",
            "course_sections",
            "password_reset_tokens",
            "points_ledger",
        ]:
            try:
                await session.execute(text(f'SELECT 1 FROM "{t}" LIMIT 1'))
                print(f"SELECT 1 from {t} OK")
            except Exception as e:
                print(f"SELECT from {t} failed:", e)


if __name__ == "__main__":
    asyncio.run(main())

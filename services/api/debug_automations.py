
import asyncio
import sys
import os
from sqlalchemy import select

sys.path.append(os.getcwd())

from app.db.session import engine, async_session_factory
from app.db.models import Automation, AutomationLog

async def debug_query():
    print("Testing Automation query...")
    async with async_session_factory() as session:
        try:
            # Try basic select
            stmt = select(Automation)
            result = await session.execute(stmt)
            automations = result.scalars().all()
            print(f"Query successful. Found {len(automations)} automations.")
            for a in automations:
                print(f" - {a.name} (Active: {a.active})")
        except Exception as e:
            print("Query FAILED.")
            print(e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_query())

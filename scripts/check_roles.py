import asyncio
import os
import sys

# Add the services/api directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'services', 'api'))

from app.db.session import SessionLocal
from app.db.models import AuthRole
from sqlalchemy import select

async def run():
    async with SessionLocal() as s:
        r = await s.execute(select(AuthRole.name))
        print(f"Roles in DB: {r.scalars().all()}")

if __name__ == "__main__":
    asyncio.run(run())

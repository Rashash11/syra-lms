
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'assignment_submissions'"))
        columns = [row[0] for row in result]
        print("Columns in assignment_submissions:", columns)

if __name__ == "__main__":
    asyncio.run(check())

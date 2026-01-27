import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

# Get database URL
database_url = os.getenv("DATABASE_URL", "")
if database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

# Create engine and check column types
engine = create_engine(database_url)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT table_name, column_name, udt_name
        FROM information_schema.columns 
        WHERE udt_name IN ('UnitType', 'unittype', 'UnitStatus', 'unitstatus')
        ORDER BY table_name, column_name
    """))
    rows = result.fetchall()
    print("Columns using enum types:")
    for row in rows:
        print(f"  - {row[0]}.{row[1]} -> {row[2]}")

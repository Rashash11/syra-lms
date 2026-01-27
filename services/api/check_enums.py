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

# Create engine and check enums
engine = create_engine(database_url)
with engine.connect() as conn:
    result = conn.execute(
        text("SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname")
    )
    rows = result.fetchall()
    print("Existing enum types in database:")
    for row in rows:
        print(f"  - {row[0]}")

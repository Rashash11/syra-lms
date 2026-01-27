"""
Database Session Management

Async SQLAlchemy session configuration and dependency injection.
"""

from typing import AsyncGenerator

from app.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Initialize database connection."""
    # Test connection
    async with engine.begin() as conn:
        await conn.execute("SELECT 1")
    print("✅ Database connection established")


async def close_db():
    """Close database connection."""
    await engine.dispose()
    print("🔌 Database connection closed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
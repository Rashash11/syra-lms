"""
SQLAlchemy Async Database Session

Provides async engine and session factory for PostgreSQL.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from app.config import get_settings

# Import hooks to register event listeners
from app.db.hooks import init_hooks, tenant_context
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.debug,
    poolclass=NullPool if settings.env == "test" else None,
    pool_pre_ping=True,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Initialize hooks on module load
init_hooks()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    async with async_session_factory() as session:
        tenant_id = tenant_context.get()
        if tenant_id:
            # Use set_config for proper parameter binding in asyncpg
            await session.execute(
                text("SELECT set_config('app.current_tenant', :t, false)"),
                {"t": tenant_id},
            )

        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions outside of FastAPI."""
    async with async_session_factory() as session:
        tenant_id = tenant_context.get()
        if tenant_id:
            await session.execute(
                text("SELECT set_config('app.current_tenant', :t, false)"),
                {"t": tenant_id},
            )

        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Initialize database connection (call on startup)."""
    # Test the connection
    async with engine.begin() as conn:
        await conn.run_sync(lambda _: None)


async def close_db() -> None:
    """Close database connections (call on shutdown)."""
    await engine.dispose()

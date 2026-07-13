"""
Database session and engine configuration.
"""

import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from passlib.context import CryptContext
from app.config import config

logger = logging.getLogger(__name__)

engine = create_async_engine(
    config.DATABASE_URL,
    echo=config.DEBUG,
    pool_size=5,
    max_overflow=10,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_db() -> AsyncSession:
    """Dependency for getting a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def _seed_default_author(db: AsyncSession):
    """Создаёт учётную запись автора по умолчанию, если её ещё нет."""
    from app.database.models import User

    result = await db.execute(select(User).where(User.name == "author"))
    existing = result.scalar_one_or_none()

    if existing is not None:
        logger.info("Default author already exists, skipping seed")
        return

    author = User(
        id=str(uuid.uuid4()),
        email="author@local.internal",
        hashed_password=_pwd_context.hash("123456"),
        name="author",
        role="author",
        created_at=datetime.now(timezone.utc),
    )
    db.add(author)
    await db.flush()
    logger.info("Default author created (login: author, password: 123456)")


async def init_db():
    """Create all tables on startup and seed default data."""
    from app.database.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

    # Создаём дефолтного автора в отдельной сессии
    async with async_session_factory() as session:
        try:
            await _seed_default_author(session)
            await session.commit()
        except Exception:
            await session.rollback()
            logger.exception("Failed to seed default author")
            raise


async def close_db():
    """Dispose the engine on shutdown."""
    await engine.dispose()
    logger.info("Database engine disposed")
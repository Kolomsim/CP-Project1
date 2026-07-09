"""
Database service layer — all async DB operations.
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User, SavedProperty, Article
from app.config import config

logger = logging.getLogger(__name__)


# ─── User operations ────────────────────────────────────────────────────────

async def create_user(
    db: AsyncSession,
    email: str,
    hashed_password: str,
    name: str,
) -> User:
    """Create a new user in the database."""
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hashed_password,
        name=name,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()
    logger.info(f"User created: {email}")
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Find user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Find user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


# ─── Saved Property operations ──────────────────────────────────────────────

async def save_property(
    db: AsyncSession,
    user_id: str,
    title: str,
    property_data: dict,
) -> SavedProperty:
    """Save a property for a user."""
    prop = SavedProperty(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        property_data=property_data,
        created_at=datetime.now(timezone.utc),
    )
    db.add(prop)
    await db.flush()
    return prop


async def get_user_properties(db: AsyncSession, user_id: str) -> list[SavedProperty]:
    """Get all saved properties for a user."""
    result = await db.execute(
        select(SavedProperty)
        .where(SavedProperty.user_id == user_id)
        .order_by(SavedProperty.created_at.desc())
    )
    return list(result.scalars().all())


async def get_property_by_id(db: AsyncSession, property_id: str, user_id: str) -> Optional[SavedProperty]:
    """Get a single saved property by ID (scoped to user)."""
    result = await db.execute(
        select(SavedProperty).where(
            SavedProperty.id == property_id,
            SavedProperty.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def delete_property(db: AsyncSession, property_id: str, user_id: str) -> bool:
    """Delete a saved property by ID (scoped to user)."""
    result = await db.execute(
        delete(SavedProperty).where(
            SavedProperty.id == property_id,
            SavedProperty.user_id == user_id,
        )
    )
    await db.flush()
    return result.rowcount > 0


# ─── Article operations ─────────────────────────────────────────────────────

async def create_article(
    db: AsyncSession,
    title: str,
    content: str,
    author_id: str,
    preview: Optional[str] = None,
    category: Optional[str] = None,
) -> Article:
    """Create a new article."""
    article = Article(
        id=str(uuid.uuid4()),
        title=title,
        content=content,
        author_id=author_id,
        preview=preview,
        category=category,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(article)
    await db.flush()
    return article


async def get_articles(db: AsyncSession, limit: int = 10, offset: int = 0) -> list[Article]:
    """Get a paginated list of articles."""
    result = await db.execute(
        select(Article)
        .order_by(Article.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_article_by_id(db: AsyncSession, article_id: str) -> Optional[Article]:
    """Get a single article by ID."""
    result = await db.execute(select(Article).where(Article.id == article_id))
    return result.scalar_one_or_none()


async def update_article(
    db: AsyncSession,
    article_id: str,
    author_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    preview: Optional[str] = None,
    category: Optional[str] = None,
) -> Optional[Article]:
    """Update an article (scoped to author)."""
    article = await get_article_by_id(db, article_id)
    if article is None or article.author_id != author_id:
        return None

    if title is not None:
        article.title = title
    if content is not None:
        article.content = content
    if preview is not None:
        article.preview = preview
    if category is not None:
        article.category = category

    article.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return article


async def delete_article(db: AsyncSession, article_id: str, author_id: str) -> bool:
    """Delete an article (scoped to author)."""
    result = await db.execute(
        delete(Article).where(
            Article.id == article_id,
            Article.author_id == author_id,
        )
    )
    await db.flush()
    return result.rowcount > 0
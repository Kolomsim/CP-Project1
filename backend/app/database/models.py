"""
SQLAlchemy ORM models for the database.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Integer, Index
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def _generate_uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─── User ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")  # "user" | "author"
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    saved_properties = relationship("SavedProperty", back_populates="user", cascade="all, delete-orphan")
    articles = relationship("Article", back_populates="author", cascade="all, delete-orphan")


# ─── Saved Properties ───────────────────────────────────────────────────────

class SavedProperty(Base):
    __tablename__ = "saved_properties"

    id = Column(String, primary_key=True, default=_generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    property_data = Column(JSON, nullable=False)  # полные данные объекта
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="saved_properties")


# ─── Articles ───────────────────────────────────────────────────────────────

class Article(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True, default=_generate_uuid)
    author_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    preview = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    search_vector = Column(TSVECTOR, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    # Relationships
    author = relationship("User", back_populates="articles")

    __table_args__ = (
        Index('ix_articles_search_vector', 'search_vector', postgresql_using='gin'),
    )
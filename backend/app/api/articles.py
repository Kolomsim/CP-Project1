"""
API эндпоинты для статей базы знаний.
Поддерживает авторов (пользователей) и CRUD для статей.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.api.auth import get_current_user_id
from app.services.db_service import (
    create_article,
    get_articles,
    get_article_by_id,
    update_article,
    delete_article,
    get_user_by_id,
)

router = APIRouter(prefix="/api/articles", tags=["Articles"])


class ArticleAuthorResponse(BaseModel):
    id: str
    name: str


class ArticleItemResponse(BaseModel):
    id: str
    title: str
    preview: Optional[str] = None
    category: Optional[str] = None
    author: Optional[ArticleAuthorResponse] = None
    created_at: str


class ArticleDetailResponse(ArticleItemResponse):
    content: str
    updated_at: str


class ArticleCreateRequest(BaseModel):
    title: str
    content: str
    preview: Optional[str] = None
    category: Optional[str] = None


class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    preview: Optional[str] = None
    category: Optional[str] = None


@router.get("/", response_model=List[ArticleItemResponse])
async def list_articles(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает список статей с информацией об авторе."""
    articles = await get_articles(db, limit=limit, offset=offset)
    result = []
    for article in articles:
        author = None
        if article.author_id:
            user = await get_user_by_id(db, article.author_id)
            if user:
                author = ArticleAuthorResponse(id=user.id, name=user.name)

        result.append(
            ArticleItemResponse(
                id=article.id,
                title=article.title,
                preview=article.preview,
                category=article.category,
                author=author,
                created_at=article.created_at.isoformat(),
            )
        )
    return result


@router.get("/{article_id}", response_model=ArticleDetailResponse)
async def get_article(
    article_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Возвращает полную статью по ID."""
    article = await get_article_by_id(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    author = None
    if article.author_id:
        user = await get_user_by_id(db, article.author_id)
        if user:
            author = ArticleAuthorResponse(id=user.id, name=user.name)

    return ArticleDetailResponse(
        id=article.id,
        title=article.title,
        preview=article.preview,
        content=article.content,
        category=article.category,
        author=author,
        created_at=article.created_at.isoformat(),
        updated_at=article.updated_at.isoformat(),
    )


@router.post("/", response_model=ArticleDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_article_endpoint(
    body: ArticleCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Создать новую статью (только для авторизованных пользователей)."""
    article = await create_article(
        db=db,
        author_id=user_id,
        title=body.title,
        content=body.content,
        preview=body.preview,
        category=body.category,
    )

    user = await get_user_by_id(db, user_id)
    author = ArticleAuthorResponse(id=user.id, name=user.name) if user else None

    return ArticleDetailResponse(
        id=article.id,
        title=article.title,
        preview=article.preview,
        content=article.content,
        category=article.category,
        author=author,
        created_at=article.created_at.isoformat(),
        updated_at=article.updated_at.isoformat(),
    )


@router.patch("/{article_id}", response_model=ArticleDetailResponse)
async def update_article_endpoint(
    article_id: str,
    body: ArticleUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Обновить статью (только для автора)."""
    kwargs = {k: v for k, v in body.model_dump().items() if v is not None}
    if not kwargs:
        raise HTTPException(status_code=400, detail="Нет полей для обновления")

    article = await update_article(db, article_id, user_id, **kwargs)
    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статья не найдена или вы не являетесь автором",
        )

    user = await get_user_by_id(db, user_id)
    author = ArticleAuthorResponse(id=user.id, name=user.name) if user else None

    return ArticleDetailResponse(
        id=article.id,
        title=article.title,
        preview=article.preview,
        content=article.content,
        category=article.category,
        author=author,
        created_at=article.created_at.isoformat(),
        updated_at=article.updated_at.isoformat(),
    )


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article_endpoint(
    article_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Удалить статью (только для автора)."""
    deleted = await delete_article(db, article_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статья не найдена или вы не являетесь автором",
        )
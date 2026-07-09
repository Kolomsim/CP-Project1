"""
API эндпоинты для сохранённых объектов недвижимости пользователя.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.api.auth import get_current_user_id
from app.services.db_service import (
    save_property,
    get_user_properties,
    get_property_by_id,
    delete_property,
)

router = APIRouter(prefix="/api/properties", tags=["Properties"])


class SavePropertyRequest(BaseModel):
    title: str
    property_data: dict


class PropertyItemResponse(BaseModel):
    id: str
    title: str
    property_data: dict
    created_at: str


class PropertyListResponse(BaseModel):
    properties: List[PropertyItemResponse]


@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Получить все сохранённые объекты недвижимости пользователя."""
    props = await get_user_properties(db, user_id)
    return PropertyListResponse(
        properties=[
            PropertyItemResponse(
                id=p.id,
                title=p.title,
                property_data=p.property_data,
                created_at=p.created_at.isoformat(),
            )
            for p in props
        ]
    )


@router.post("/", response_model=PropertyItemResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: SavePropertyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Сохранить объект недвижимости."""
    prop = await save_property(db, user_id, body.title, body.property_data)
    return PropertyItemResponse(
        id=prop.id,
        title=prop.title,
        property_data=prop.property_data,
        created_at=prop.created_at.isoformat(),
    )


@router.get("/{property_id}", response_model=PropertyItemResponse)
async def get_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Получить конкретный объект недвижимости."""
    prop = await get_property_by_id(db, property_id, user_id)
    if prop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )
    return PropertyItemResponse(
        id=prop.id,
        title=prop.title,
        property_data=prop.property_data,
        created_at=prop.created_at.isoformat(),
    )


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Удалить сохранённый объект."""
    deleted = await delete_property(db, property_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )
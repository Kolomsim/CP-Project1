from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from .common import PropertyType, DealType

# Запрос = ссылка на объект недвижимости
class PropertyInfoRequest(BaseModel):
    session_id: str = Field(..., description="ID сессии из шага 1")
    url: str = Field(..., description="Ссылка на объект недвижимости", example="https://cian.ru/sale/123456/")


class Seller(BaseModel):
    name: str = Field(None, description="ФИО продавца")
    phone: Optional[str] = Field(None, description="Телефон продавца")
    inn: Optional[str] = Field(None, description="ИНН продавца (для проверки банкротства)")


# Геолокация объекта
class Location(BaseModel):
    lat: float = Field(..., description="Широта", example=55.7558)
    lon: float = Field(..., description="Долгота", example=37.6173)
    address: Optional[str] = Field(None, description="Полный адрес")


class PropertyPreviewResponse(BaseModel):
    # Идентификаторы
    id: Optional[str] = Field(None, description="ID объекта на платформе")
    platform: str = Field(..., description="Платформа (ЦИАН, Авито, Домклик)", example="ЦИАН")
    url: HttpUrl = Field(..., description="Ссылка на объект")
    
    # Основные данные
    title: str = Field(..., description="Название объекта", example="Недвижимость 1")
    address: str = Field(..., description="Адрес объекта")
    price: int = Field(..., description="Цена в рублях", example=12000000)
    
    # Характеристики
    total_area: float = Field(..., description="Общая площадь, м²", example=48.0)
    living_area: Optional[float] = Field(None, description="Жилая площадь, м²", example=20.0)
    kitchen_area: Optional[float] = Field(None, description="Площадь кухни, м²", example=13.0)
    floor: int = Field(..., description="Этаж", example=8)
    total_floors: int = Field(..., description="Всего этажей в доме", example=10)
    rooms: int = Field(..., description="Количество комнат", example=1)
    
    property_type: PropertyType = Field(..., description="Тип недвижимости")
    deal_type: Optional[DealType] = Field(None, description="Тип сделки")
    
    # Продавец
    seller: Seller = Field(..., description="Информация о продавце")
    
    # Локация
    location: Location = Field(..., description="Геолокация")
    
    # Дополнительно
    description: Optional[str] = Field(None, description="Описание объекта")
    is_verified: bool = Field(False, description="Проверен ли объект")

class NearbyPlace(BaseModel):
    name: str
    address: str
    category: str          # "хороший" или "плохой"
    type: str
    distance_meters: float
    lat: float
    lon: float

class NearbyResponse(BaseModel):
    good: List[NearbyPlace]
    bad: List[NearbyPlace]
    total_good: int
    total_bad: int
    radius_used: int
    cached: bool
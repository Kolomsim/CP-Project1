from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional

# Запрос = ссылка на объект недвижимости
class PropertyInfoRequest(BaseModel):
    session_id: str = Field(..., description="ID сессии из шага 1")
    url: HttpUrl = Field(..., description="Ссылка на объект недвижимости", example="https://cian.ru/sale/123456/")


class Seller(BaseModel):
    name: str = Field(..., description="ФИО продавца / название застройщика")
    phone: Optional[str] = Field(None, description="Телефон продавца")
    inn: Optional[str] = Field(None, description="ИНН продавца (для проверки банкротства)")
    type: Optional[str] = Field(None, description="Тип продавца: owner, agency, developer")
    company_name: Optional[str] = Field(None, description="Название компании (для агентств и застройщиков)")
    ogrn: Optional[str] = Field(None, description="ОГРН компании (из ФНС)")
    full_name: Optional[str] = Field(None, description="Полное наименование компании (из ФНС)")
    nalog_status: Optional[str] = Field(None, description="Статус организации в ФНС")
    registration_date: Optional[str] = Field(None, description="Дата регистрации (из ФНС)")
    region: Optional[str] = Field(None, description="Регион (из ФНС)")
    okved: Optional[str] = Field(None, description="Основной ОКВЭД (из ФНС)")


# Геолокация объекта
class Location(BaseModel):
    lat: float = Field(..., description="Широта", example=55.7558)
    lon: float = Field(..., description="Долгота", example=37.6173)
    address: Optional[str] = Field(None, description="Полный адрес")


class PropertyPreviewResponse(BaseModel):
    # Идентификаторы
    id: str = Field(..., description="ID объекта на платформе")
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
    
    property_type: str = Field(..., description="Тип недвижимости")
    deal_type: Optional[str] = Field(None, description="Тип сделки")
    market_category: Optional[str] = Field(
        None,
        description="Тип рынка (новостройка/вторичка), из CIAN property_old",
        example="вторичка",
    )
    
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
    category: str
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
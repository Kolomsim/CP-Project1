from pydantic import BaseModel, Field
from typing import Optional


class NalogCompanyInfo(BaseModel):
    """Информация о компании из ФНС (Прозрачный бизнес)"""
    inn: Optional[str] = Field(None, description="ИНН")
    ogrn: Optional[str] = Field(None, description="ОГРН")
    short_name: Optional[str] = Field(None, description="Краткое наименование")
    full_name: Optional[str] = Field(None, description="Полное наименование")
    status: Optional[str] = Field(None, description="Статус организации")
    registration_date: Optional[str] = Field(None, description="Дата регистрации")
    region: Optional[str] = Field(None, description="Регион")
    okved: Optional[str] = Field(None, description="Основной вид деятельности (ОКВЭД)")
    director: Optional[str] = Field(None, description="Руководитель")
    authorized_capital: Optional[int] = Field(None, description="Уставной капитал")
    address: Optional[str] = Field(None, description="Юридический адрес")
    mass_director: Optional[bool] = Field(None, description="Признак массового руководителя")
    mass_founder: Optional[bool] = Field(None, description="Признак массового учредителя")
    is_reliable: Optional[bool] = Field(None, description="Признак надёжности")
    is_active: Optional[bool] = Field(None, description="Действующая ли организация")
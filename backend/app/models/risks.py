from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models import RiskLevel

class Risk(BaseModel):
    """
    Один пункт риска в отчёте.
    """
    type: str = Field(..., description="Тип риска", example="bankruptcy")
    severity: RiskLevel = Field(..., description="Уровень серьёзности")
    title: str = Field(..., description="Краткий заголовок", example="Владелец найден в реестре банкротства")
    description: str = Field(..., description="Подробное описание")
    recommendation: str = Field(..., description="Рекомендация для пользователя")
    article_link: Optional[str] = Field(None, description="Ссылка на статью в базе знаний")
    details: Optional[str] = Field(None, description="Дополнительные детали (например, номер дела)")
    auto_check: Optional[bool] = Field(None, description="Флаг: риск можно перепроверить автоматически")
    check_url: Optional[str] = Field(None, description="Ссылка для перепроверки риска")

class RequiredDocument(BaseModel):
    """
    Документ, который нужен для сделки.
    """
    name: str = Field(..., description="Название документа")
    description: Optional[str] = Field(None, description="Описание")
    where_to_get: Optional[str] = Field(None, description="Где взять документ")
    urgency: RiskLevel = Field(..., description="Срочность (low/medium/high/critical)")

# --- Полный ответ (результат проверки) ---

class CheckRisksResponse(BaseModel):
    """
    Полный отчёт о проверке.
    Возвращается после выполнения всех проверок.
    """
    # Список проблем
    problems: List[Risk] = Field(default_factory=list, description="Найденные риски")
    overall_rating: str = Field(..., description="Итоговый рейтинг сделки")
    
    # Документы, которые нужны пользователю
    required_documents: List[RequiredDocument] = Field(
        default_factory=list,
        description="Чек-лист документов для сделки"
    )
    
    # Детали объекта (дублируем из предпросмотра)
    property_details: dict = Field(..., description="Детали объекта недвижимости")
    
    # Метрики
    risk_count: int = Field(0, description="Всего найдено рисков")
    critical_count: int = Field(0, description="Количество критических рисков")
    check_date: datetime = Field(default_factory=datetime.now, description="Дата проверки")
    
    # Ссылки на статьи (для блока "База знаний")
    related_articles: List[str] = Field(
        default_factory=list,
        description="Список рекомендованных статей"
    )
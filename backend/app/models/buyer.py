from pydantic import BaseModel, Field
from typing import Optional
from app.models.common import Citizenship, FamilyStatus, DealType

# Данные, которые отправляет пользователь в форме
class BuyerInfoRequest(BaseModel):
    citizenship: Citizenship = Field(
        ..., 
        description="Гражданство покупателя",
        example="Российская Федерация"
    )
    marital_status: FamilyStatus = Field(
        ...,
        description="Семейное положение",
        example="Холост"
    )
    purchase_method: DealType = Field(
        ...,
        description="Способ покупки",
        example="Ипотека"
    )

# Ответ 
class BuyerInfoResponse(BaseModel):
    success: bool = Field(..., description="Успешно ли сохранено")
    session_id: str = Field(..., description="ID сессии для следующих шагов")
    next_step: str = Field(..., description="URL следующего шага", example="/api/deal/property-info")
    message: Optional[str] = Field(None, description="Сообщение для пользователя")
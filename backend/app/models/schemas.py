from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

class PropertyType(str, Enum):
    HOUSE = "house"
    FLAT_NEW = "flat_new"
    FLAT_OLD = "flat_old"

class RiskLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RiskCategory(str, Enum):
    LEGAL = "legal"
    FINANCIAL = "financial"
    ENVIRONMENTAL = "environmental"
    TECHNICAL = "technical"

class Citizenship(str, Enum):
    RUSSIAN_FEDERATION = "Russian Feaderation"
    UKRAINE = "Ukraine"
    BELARUS = "Belarus"
    KAZAKHSTAN = "Kazakhstan"

class FamilyStatus(str, Enum):
    SINGLE = "single"
    MARRIED = "married"

class PurchaseMethod(str, Enum):
    MORTRAGE = "mortrage" # ипотека
    CASH = "cash"
    LOAN = "loan"

# данные, которые пользователь отправляет из формы
class FromForm(BaseModel):
    citizenship: Citizenship
    family_status: FamilyStatus
    purchase_method: PurchaseMethod

# итоговый вердикт по сделке (отчёт)
class Risk(BaseModel):
    pass

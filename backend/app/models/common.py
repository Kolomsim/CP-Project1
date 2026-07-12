from enum import Enum

class PropertyType(str, Enum):
    flat = "квартира"
    apartment = "апартаменты"

class RiskLevel(str, Enum):
    HIGH = "высокий"
    MEDIUM = "средний"
    LOW = "низкий"

class Citizenship(str, Enum):
    RUSSIAN_FEDERATION = "Россия"
    UKRAINE = "Украина"
    BELARUS = "Беларусь"
    KAZAKHSTAN = "Казахстан"

class FamilyStatus(str, Enum):
    SINGLE = "Холост"
    MARRIED = "Женат/Замужем"

class DealType(str, Enum):
    MORTGAGE = "Ипотека"
    IMMEDIATELY = "Сразу"
    LOAN = "Кредит"
    MAT_CAPITAL = "Материнский капитал"
    STATE_SUPPORT = "Государственная поддержка"
    OTHER = "Другое"
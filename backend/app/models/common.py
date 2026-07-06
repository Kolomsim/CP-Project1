from enum import Enum

class PropertyType(str, Enum):
    HOUSE = "дом"
    FLAT_NEW = "новостройка"
    FLAT_OLD = "вторичка"

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
    MORTRAGE = "Ипотека"
    IMMEDIATELY = "Сразу"
    LOAN = "Кредит"
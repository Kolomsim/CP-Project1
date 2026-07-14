"""
Возвращает классификацию объекта при поиске
плохих/хороших в окрестности
"""

GOOD_KEYWORDS = {
    "школа", "гимназия", "лицей", "детский сад", "сад",
    "парк", "сквер", "бульвар", "набережная",
    "спорт", "фитнес", "бассейн", "стадион", "тренажерный",
    "поликлиника", "больница", "аптека", "медцентр",
    "библиотека", "музей", "театр", "кинотеатр",
    "метро", "мцд", "мцк",
    "торговый центр", "тц", "супермаркет", "магазин",
}

BAD_KEYWORDS = {
    "завод", "фабрика", "комбинат", "тэц", "котельная",
    "свалка", "полигон", "мусор",
    "ж/д", "железнодорожный", "жд станция", "депо",
    "лэп", "подстанция",
    "кладбище", "крематорий",
    "автомойка", "шиномонтаж", "сто", "автосервис",
}

def classify_place(name: str, rubrics: list) -> str:
    """
    Возвращает 'good', 'bad' или 'unknown'
    """
    name_lower = name.lower()
    
    for rubric in rubrics:
            rubric_lower = rubric.lower()
            if any(kw in rubric_lower for kw in GOOD_KEYWORDS):
                return "good"
            if any(kw in rubric_lower for kw in BAD_KEYWORDS):
                return "bad"

    # Проверяем название
    if any(kw in name_lower for kw in GOOD_KEYWORDS):
        return "good"
    if any(kw in name_lower for kw in BAD_KEYWORDS):
        return "bad"

    return "unknown"

def get_place_type(name: str, rubrics: list) -> str:
    """
    Возвращает тип объекта (первая рубрика или 'other')
    """
    if rubrics:
        return rubrics[0]
    return "other"
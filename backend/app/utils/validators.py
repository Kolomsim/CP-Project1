from urllib.parse import urlparse
import re
import phonenumbers


SUPPORTED_PLATFORMS = {
    "cian.ru": "ЦИАН",
    "avito.ru": "Авито",
    "domclick.ru": "Домклик",
    "yandex.ru": "Яндекс.Недвижимость",
    "smartcheck.ru": "SmartCheck",  # для тестов
}

def validate_url(url: str) -> bool:
    """
    Проверяет, что ссылка ведёт на поддерживаемый сайт.
    """
    if not url or not isinstance(url, str):
        return False
    
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if not parsed.scheme or not parsed.netloc:
        return False

    netloc = parsed.netloc.lower()

    domain = netloc.split(":")[0]

    return domain in SUPPORTED_PLATFORMS.keys()

def detect_platform(url: str) -> str | None:
    """
    Определяет платформу по URL.
    Возвращает название платформы или None.
    """
    if not url or not isinstance(url, str):
        return None
    try:
        parsed = urlparse(url)
    except Exception:
        return None

    if not parsed.netloc:
        return None

    domain = parsed.netloc.lower().split(":")[0].removeprefix("www.")
    return SUPPORTED_PLATFORMS.get(domain)


def extract_id_cian(url: str) -> str | None:
    m = re.search(r'/sale/(?:flat|room|house|land)/([0-9]+)', url)
    return m.group(1) if m else None

def extract_id_avito(url: str) -> str | None:
    # разные варианты Avito
    patterns = [
        r'/item/([0-9]+)',
        r'i([0-9]+)\.htm',
        r'/([0-9]+)$',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None

def extract_id_from_url_smart(url: str) -> str | None:
    if not url:
        return None

    platform = detect_platform(url)  
    if platform == "ЦИАН":
        return extract_id_cian(url)
    elif platform == "Авито":
        return extract_id_avito(url)

    patterns = [
        r'/(\d+)/?$',
        r'/id(\d+)',
        r'_(\d+)$',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None



def validate_phone(phone: str) -> bool:
    try:
        num = phonenumbers.parse(phone, None)  # регион определяется автоматически
        return phonenumbers.is_valid_number(num)
    except phonenumbers.NumberParseException:
        return False



def validate_name(name: str) -> bool:
    return bool(name and re.match(r'^[а-яА-Яa-zA-Z\s\-]+$', name))
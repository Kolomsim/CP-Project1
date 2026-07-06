from urllib.parse import urlparse
import re
import phonenumbers


SUPPORTED_PLATFORMS = {
    "cian": "ЦИАН",
    "domclick": "Домклик"
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

    if (netloc.split(".")[0] in SUPPORTED_PLATFORMS) or (netloc.split(".")[1] in SUPPORTED_PLATFORMS):
      return True
    else:
      return False

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

    domain = parsed.netloc.lower().split(".")[0].removeprefix("www.")
    if parsed.netloc.lower().split(".")[0].removeprefix("www.") in SUPPORTED_PLATFORMS:
      return parsed.netloc.lower().split(".")[0].removeprefix("www.")
    elif parsed.netloc.lower().split(".")[1].removeprefix("www.") in SUPPORTED_PLATFORMS:
      return parsed.netloc.lower().split(".")[1].removeprefix("www.")
    else:
      return None


def extract_id_cian(url: str) -> str | None:
    m = re.search(r'/sale/(?:flat|room|house|land)/([0-9]+)', url)
    return m.group(1) if m else None
  
def extract_id_domclick(url: str) -> str | None:
    m = re.search(r'/card/sale__flat__([0-9]+)', url)
    return m.group(1) if m else None

# def extract_id_avito(url: str) -> str | None:
#     # разные варианты Avito
#     patterns = [
#         r'/item/([0-9]+)',
#         r'i([0-9]+)\.htm',
#         r'/([0-9]+)$',
#     ]
#     for p in patterns:
#         m = re.search(p, url)
#         if m:
#             return m.group(1)
#     return None

def extract_id_from_url(url: str) -> str | None:
    if not url:
        return None

    platform = detect_platform(url) 
    if SUPPORTED_PLATFORMS.get(platform, "") == "ЦИАН":
        return extract_id_cian(url)
    elif SUPPORTED_PLATFORMS.get(platform, "") == "Домклик":
        return extract_id_domclick(url)
    else:
      return None

def validate_phone(phone: str) -> bool:
    try:
        num = phonenumbers.parse(phone, None)  # регион определяется автоматически
        return phonenumbers.is_valid_number(num)
    except phonenumbers.NumberParseException:
        return False



def validate_name(name: str) -> bool:
    return bool(name and re.match(r'^[а-яА-Яa-zA-Z\s\-]+$', name))
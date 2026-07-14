import re
import json
import logging
from curl_cffi import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_message

from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

from app.utils.validators import validate_url, detect_platform, extract_id_from_url
from app.config import config

logger = logging.getLogger(__name__)

class ParserError(Exception):
    pass


class CianListingParser:
    """Парсер для отдельных объявлений ЦИАН"""

    def __init__(self):
        self.session = requests.Session(impersonate="chrome120")
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }
        self.session.headers.update(self.headers)

    def parse_listing(self, url: str) -> Dict[str, Any]:
        """Парсит объявление с использованием requests"""
        try:
            html = self._fetch_page(url)
            soup = BeautifulSoup(html, 'html.parser')
            return self._extract_data(soup, html, url)
        except Exception as e:
            logger.error(f"Ошибка HTTP запроса или парсинга: {e}")
            raise Exception(f"Не удалось загрузить или разобрать страницу: {str(e)}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_message(match=".*(timed out|Timeout|Connection).*"),
        reraise=True,
    )
    def _fetch_page(self, url: str) -> str:
        session = requests.Session(impersonate="chrome120")
        session.headers.update(self.headers)
        response = session.get(url, timeout=45)
        response.raise_for_status()
        return response.text

    @staticmethod
    def _merge_missing(data: Dict[str, Any], new_data: Dict[str, Any]) -> None:
        """Дополняет data значениями из new_data, не перезаписывая уже найденное."""
        for key, value in new_data.items():
            if key not in data:
                data[key] = value
            elif isinstance(data[key], dict) and isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    data[key].setdefault(sub_key, sub_value)

    def _extract_data(self, soup: BeautifulSoup, html: str, url: str) -> Dict[str, Any]:
        """Извлекает данные из HTML"""
        data = {}

        # 1. JSON-LD (цена, название, описание)
        json_ld_data = self._extract_from_json_ld(soup)
        data.update(json_ld_data)

        # 2. Встроенный JSON в script тегах (аналитика)
        inline_json_data = self._extract_from_inline_json(soup, html)
        data.update(inline_json_data)

        # 3. OpenGraph мета-теги (этаж, комнаты, адрес)
        og_data = self._extract_from_opengraph(soup)
        data.update(og_data)

        # 4. HTML разметка (дополнительные данные)
        html_data = self._extract_from_html(soup, html, url)
        data.update(html_data)

        # 5. Основной источник – window._cianConfig
        cian_config_data = self._extract_from_cian_config(html)
        data.update(cian_config_data)

        return data

    @staticmethod
    def _extract_account_info(text: str) -> Dict[str, str]:
        """Извлекает accountType и companyName независимо друг от друга."""
        account_type_match = re.search(r'"accountType"\s*:\s*"([^"]*)"', text)
        company_name_match = re.search(r'"companyName"\s*:\s*"([^"]*)"', text)
        return {
            'account_type': account_type_match.group(1) if account_type_match else 'owner',
            'company_name': company_name_match.group(1) if company_name_match else '',
        }

    @staticmethod
    def _extract_balanced(text: str, start_idx: int) -> Optional[str]:
        """Возвращает сбалансированную JSON-подстроку, начиная с '{' или '['."""
        if start_idx >= len(text) or text[start_idx] not in '{[':
            return None
        depth = 0
        in_string = False
        escape = False
        for i in range(start_idx, len(text)):
            ch = text[i]
            if in_string:
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch in '{[':
                depth += 1
            elif ch in '}]':
                depth -= 1
                if depth == 0:
                    return text[start_idx:i + 1]
        return None

    def _extract_json_value_by_key(self, text: str, key_name: str) -> Any:
        """Из массива [{"key":"...", "value": ...}] извлекает value по ключу."""
        m = re.search(
            r'"key"\s*:\s*"' + re.escape(key_name) + r'"\s*,\s*"value"\s*:\s*',
            text,
        )
        if not m:
            return None
        value_start = m.end()
        value_str = self._extract_balanced(text, value_start)
        if not value_str:
            return None
        try:
            return json.loads(value_str)
        except json.JSONDecodeError as e:
            logger.debug(f"Не удалось распарсить value для key={key_name}: {e}")
            return None

    def _apply_offer_fields(self, data: Dict[str, Any], offer: Dict[str, Any],
                            agent: Optional[Dict[str, Any]] = None,
                            tracking_offer_phone: Optional[str] = None) -> None:
        """Раскладывает offer/agent по полям итогового data."""
        agent = agent or {}

        # Координаты
        geo = offer.get('geo') or {}
        coordinates = geo.get('coordinates') or {}
        if coordinates.get('lat') is not None and coordinates.get('lng') is not None:
            try:
                data['location'] = {
                    'lat': float(coordinates['lat']),
                    'lon': float(coordinates['lng']),
                }
            except (TypeError, ValueError):
                pass

        # Адрес
        address_list = geo.get('address') or []
        names = [
            item.get('fullName') for item in address_list
            if isinstance(item, dict) and item.get('fullName')
        ]
        if names:
            data['address'] = ', '.join(names)
            data.setdefault('location', {})['address'] = data['address']

        def _num(source: Dict[str, Any], key: str, cast):
            val = source.get(key)
            if val is None:
                return None
            try:
                return cast(val)
            except (TypeError, ValueError):
                return None

        # Числовые характеристики
        for src_key, target, cast in (
            ('totalArea', 'total_area', float),
            ('livingArea', 'living_area', float),
            ('kitchenArea', 'kitchen_area', float),
            ('floorNumber', 'floor', int),
            ('roomsCount', 'rooms', int),
        ):
            val = _num(offer, src_key, cast)
            if val is not None:
                data[target] = val

        # Цена
        price = _num(offer.get('bargainTerms') or {}, 'price', int)
        if price is not None:
            data['price'] = price

        # Этажность
        total_floors = _num(offer.get('building') or {}, 'floorsCount', int)
        if total_floors is not None:
            data['total_floors'] = total_floors

        # Описание
        if offer.get('description'):
            data['description'] = offer['description']

        # Телефон из offer.phones (основной), fallback – tracking.offerPhone
        phone_str = None
        phones = offer.get('phones') or []
        if phones and isinstance(phones[0], dict) and phones[0].get('number'):
            phone_str = f"{phones[0].get('countryCode', '')}{phones[0]['number']}"
        elif tracking_offer_phone:
            phone_str = tracking_offer_phone

        # Продавец
        seller: Dict[str, Any] = {}

        # Тип продавца
        if agent.get('accountType'):
            seller['type'] = self._map_seller_type(agent['accountType'])
        elif offer.get('isByHomeowner'):
            seller['type'] = 'owner'
        else:
            seller['type'] = 'unknown'

        # Имя и компания
        if agent.get('name'):
            seller['name'] = agent['name']
        if agent.get('companyName'):
            seller['company_name'] = agent['companyName']
        # Для собственника без имени оставляем пустым (позже подставится "Неизвестно")

        if phone_str:
            seller['phone'] = phone_str

        if seller:
            data['seller'] = seller

    def _extract_from_cian_config_fallback(self, array_str: str) -> Dict[str, Any]:
        """Резервный путь, если не удалось распарсить offerData."""
        data: Dict[str, Any] = {}
        coord_match = re.search(
            r'"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([0-9.\-]+)\s*,\s*"lng"\s*:\s*([0-9.\-]+)\s*\}',
            array_str,
        )
        if coord_match:
            data['location'] = {
                'lat': float(coord_match.group(1)),
                'lon': float(coord_match.group(2)),
            }
        account_info = self._extract_account_info(array_str)
        seller = {}
        if account_info['account_type']:
            seller['type'] = self._map_seller_type(account_info['account_type'])
        if account_info['company_name']:
            seller['company_name'] = account_info['company_name']
        if seller:
            data['seller'] = seller
        return data

    def _extract_from_cian_config(self, html: str) -> Dict[str, Any]:
        """Извлекает данные из window._cianConfig['frontend-offer-card'] (новый формат)."""
        data: Dict[str, Any] = {}

        anchor = re.search(
            r"window\._cianConfig\['frontend-offer-card'\]\s*=\s*"
            r"\(window\._cianConfig\['frontend-offer-card'\]\s*\|\|\s*\[\]\)\.concat\(",
            html,
        )
        if not anchor:
            return data

        array_start = html.find('[', anchor.end() - 1)
        if array_start == -1:
            return data

        array_str = self._extract_balanced(html, array_start)
        if not array_str:
            logger.debug("Не удалось сбалансированно извлечь массив _cianConfig")
            return data

        try:
            state = self._extract_json_value_by_key(array_str, 'defaultState')
            if not isinstance(state, dict):
                return self._extract_from_cian_config_fallback(array_str)

            offer_data = state.get('offerData')
            offer = offer_data.get('offer') if isinstance(offer_data, dict) else None
            agent = offer_data.get('agent') if isinstance(offer_data, dict) else None

            if not isinstance(offer, dict):
                return self._extract_from_cian_config_fallback(array_str)

            # Резервный телефон из tracking
            tracking_phone = None
            tracking = state.get('tracking') or {}
            page = tracking.get('page') or {}
            extra = page.get('extra') or {}
            if extra.get('offerPhone'):
                tracking_phone = extra['offerPhone']

            self._apply_offer_fields(data, offer,
                                     agent if isinstance(agent, dict) else None,
                                     tracking_phone)

        except Exception as e:
            logger.debug(f"Ошибка при разборе cianConfig: {e}")

        # Дополнительно извлекаем координаты/адрес, если не найдены (старый fallback)
        coord_match = re.search(
            r'"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([0-9.+-]+)\s*,\s*"(?:lng|lon)"\s*:\s*([0-9.+-]+)\s*\}',
            html,
        )
        if coord_match:
            lat = float(coord_match.group(1))
            lon = float(coord_match.group(2))
            if lat != 0 or lon != 0:
                data.setdefault('location', {})['lat'] = lat
                data.setdefault('location', {})['lon'] = lon

        address_parts_match = re.search(
            r'"geo"\s*:\s*\{\s*"address"\s*:\s*\[(.*?)\]\s*,\s*"coordinates"',
            html,
            re.DOTALL,
        )
        if address_parts_match:
            parts = re.findall(r'"fullName"\s*:\s*"([^"]+)"', address_parts_match.group(1))
            if parts:
                address = ', '.join(parts)
                data['address'] = address
                data.setdefault('location', {})['address'] = address

        # Тип жилья (вторичка/новостройка)
        match = re.search(r'"value"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"Тип жилья"', html)
        if match:
            data['property_old'] = match.group(1)
        else:
            data['property_old'] = 'неизвестно'

        return data

    def _extract_from_json_ld(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Извлекает данные из JSON-LD разметки"""
        data = {}
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                json_data = json.loads(script.string)
                if isinstance(json_data, dict) and json_data.get('@type') == 'Product':
                    data['title'] = json_data.get('name', '')
                    data['description'] = json_data.get('description', '')
                    data['id'] = json_data.get('sku')
                    offers = json_data.get('offers', {})
                    if isinstance(offers, dict):
                        price = offers.get('price')
                        if price:
                            data['price'] = int(price)
                elif isinstance(json_data, list):
                    for item in json_data:
                        if isinstance(item, dict) and item.get('@type') == 'Product':
                            data['title'] = item.get('name', '')
                            data['description'] = item.get('description', '')
                            data['id'] = item.get('sku')
                            offers = item.get('offers', {})
                            if isinstance(offers, dict):
                                price = offers.get('price')
                                if price:
                                    data['price'] = int(price)
                            break
            except (json.JSONDecodeError, AttributeError, ValueError) as e:
                logger.debug(f"Ошибка при разборе JSON-LD: {e}")
                continue
        return data

    def _extract_from_inline_json(self, soup: BeautifulSoup, html: str) -> Dict[str, Any]:
        """Извлекает данные из встроенных JSON в script тегах"""
        data = {}
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'offerPhone' in script.string:
                try:
                    match = re.search(r'var\s+i\s*=\s*({.*?});', script.string, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        json_data = json.loads(json_str)
                        page = json_data.get('page', {})
                        if 'offerPhone' in page:
                            data.setdefault('seller', {})['phone'] = page['offerPhone']
                        if 'offerAgentType' in page:
                            data.setdefault('seller', {})['type'] = self._map_seller_type(page['offerAgentType'])
                        if 'offerAgentName' in page:
                            data.setdefault('seller', {})['name'] = page['offerAgentName']
                        if 'breadCrumbs' in page:
                            breadcrumbs = page['breadCrumbs']
                            if breadcrumbs:
                                specific_address = []
                                for crumb in breadcrumbs:
                                    if not any(skip in crumb for skip in ['Недвижимость', 'Продажа', 'квартир']):
                                        specific_address.append(crumb)
                                if specific_address:
                                    if not data.get('address'):
                                        data['address'] = ', '.join(specific_address)
                                    if 'location' not in data:
                                        data['location'] = {}
                                    data['location']['address'] = ', '.join(specific_address)
                        products = json_data.get('products', [])
                        if products and len(products) > 0:
                            product = products[0]
                            if 'price' in product and product['price']:
                                if not data.get('price'):
                                    data['price'] = int(product['price'])
                except (json.JSONDecodeError, AttributeError, TypeError) as e:
                    logger.debug(f"Ошибка при разборе аналитического скрипта: {e}")
                    continue
        return data

    def _extract_from_opengraph(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Извлекает данные из OpenGraph мета-тегов"""
        data = {}
        og_title_tag = soup.find('meta', property='og:title')
        if og_title_tag and og_title_tag.get('content'):
            og_title = og_title_tag['content']
            rooms_match = re.search(r'(\d+)-комнатн', og_title)
            if rooms_match:
                data['rooms'] = int(rooms_match.group(1))
            floor_match = re.search(r'этаж\s+(\d+)/(\d+)', og_title)
            if floor_match:
                data['floor'] = int(floor_match.group(1))
                data['total_floors'] = int(floor_match.group(2))
            if not data.get('price') or data.get('price') == 0:
                price_match = re.search(r'за\s+([\d\s]+)\s*руб', og_title)
                if price_match:
                    data['price'] = int(price_match.group(1).replace(' ', ''))
        og_desc_tag = soup.find('meta', property='og:description')
        if og_desc_tag and og_desc_tag.get('content'):
            og_desc = og_desc_tag['content']
            if not data.get('address'):
                data['address'] = og_desc
                if 'location' not in data:
                    data['location'] = {}
                data['location']['address'] = og_desc
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            desc_text = meta_desc['content']
            if not data.get('price') or data.get('price') == 0:
                price_match = re.search(r'Цена продажи\s*-\s*([\d\s]+)\s*руб', desc_text)
                if price_match:
                    data['price'] = int(price_match.group(1).replace(' ', ''))
        return data

    def _extract_from_html(self, soup: BeautifulSoup, html: str, url: str) -> Dict[str, Any]:
        """Извлекает данные из HTML разметки"""
        data = {}
        page_text = soup.get_text()

        if not data.get('total_area') or data.get('total_area') == 0:
            area_patterns = [
                (r'Общая площадь.*?(\d+[.,]?\d*)\s*м²', 'total_area'),
                (r'(\d+[.,]?\d*)\s*м².*?общая', 'total_area'),
            ]
            for pattern, key in area_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE | re.DOTALL)
                if match:
                    data[key] = float(match.group(1).replace(',', '.'))
                    break

        if not data.get('living_area') or data.get('living_area') == 0:
            match = re.search(r'Жилая площадь.*?(\d+[.,]?\d*)\s*м²', page_text, re.IGNORECASE | re.DOTALL)
            if match:
                data['living_area'] = float(match.group(1).replace(',', '.'))

        if not data.get('kitchen_area') or data.get('kitchen_area') == 0:
            match = re.search(r'(?:Площадь кухни|кухня).*?(\d+[.,]?\d*)\s*м²', page_text, re.IGNORECASE | re.DOTALL)
            if match:
                data['kitchen_area'] = float(match.group(1).replace(',', '.'))

        if not data.get('rooms') or data.get('rooms') == 0:
            rooms_match = re.search(r'(\d+)\s*комн', page_text, re.IGNORECASE)
            if rooms_match:
                data['rooms'] = int(rooms_match.group(1))

        if not data.get('floor') or data.get('floor') == 0:
            floor_match = re.search(r'(\d+)\s*этаж.*?из\s*(\d+)', page_text, re.IGNORECASE)
            if floor_match:
                data['floor'] = int(floor_match.group(1))
                data['total_floors'] = int(floor_match.group(2))

        if 'seller' not in data:
            data['seller'] = {}

        # Поиск компании/агентства
        agency_elem = soup.find('a', href=re.compile(r'/company/\d+'))
        if agency_elem:
            if not data['seller'].get('company_name'):
                data['seller']['company_name'] = agency_elem.get_text(strip=True)
            if not data['seller'].get('type'):
                data['seller']['type'] = 'agency'

        # Поиск риелтора
        agent_elem = soup.find('a', href=re.compile(r'/agents/\d+'))
        if agent_elem:
            if not data['seller'].get('name'):
                data['seller']['name'] = agent_elem.get_text(strip=True)

        # Поиск телефона в data-атрибутах
        if not data['seller'].get('phone'):
            phone_match = re.search(r'"offerPhone"\s*:\s*"([^"]+)"', html)
            if phone_match:
                data['seller']['phone'] = phone_match.group(1)

        return data

    def _map_seller_type(self, seller_type: str) -> str:
        """Преобразует тип продавца из API в наш формат"""
        if not seller_type:
            return 'unknown'
        seller_type_lower = str(seller_type).lower()
        mapping = {
            'owner': 'owner',
            'private': 'owner',
            'собственник': 'owner',
            'физическое лицо': 'owner',
            'individual': 'owner',
            'agent': 'agency',
            'agency': 'agency',
            'realtor': 'agency',
            'брокер': 'agency',
            'риелтор': 'agency',
            'агентство': 'agency',
            'агент': 'agency',
            'specialist': 'agency',
            'developer': 'developer',
            'застройщик': 'developer',
            'builder': 'developer',
            'realtor_not_commerce': 'agency',   # новое значение
        }
        return mapping.get(seller_type_lower, 'unknown')

    def _parse_price(self, price_str: str) -> int:
        if not price_str:
            return 0
        digits = re.sub(r'[^\d]', '', str(price_str))
        return int(digits) if digits else 0


def _parse_cian_single_listing(url: str, obj_id: str) -> Dict[str, Any]:
    """Парсит отдельное объявление ЦИАН по URL."""
    logger.info(f"Парсинг отдельного объявления ЦИАН: ID {obj_id}, URL: {url}")
    parser = CianListingParser()
    flat_data = parser.parse_listing(url)

    seller_data = flat_data.get("seller", {})
    seller = {
        "name": seller_data.get("name", "Неизвестно"),
        "phone": seller_data.get("phone", ""),
        "type": seller_data.get("type", "unknown"),
        "company_name": seller_data.get("company_name", ""),
        "inn": None,
    }

    # Преобразуем в наш внутренний формат
    location = flat_data.get("location") or {}
    normalized_location = {
        "lat": float(location.get("lat") or 0.0),
        "lon": float(location.get("lon") or 0.0),
        "address": location.get("address") or flat_data.get("address", ""),
    }

    return {
        "id": obj_id,
        "platform": "ЦИАН",
        "url": url,
        "title": flat_data.get("title", "Недвижимость"),
        "address": flat_data.get("address", ""),
        "price": flat_data.get("price", 0),
        "total_area": flat_data.get("total_area", 0.0),
        "living_area": flat_data.get("living_area", 0.0),
        "kitchen_area": flat_data.get("kitchen_area", 0.0),
        "floor": flat_data.get("floor", 0),
        "total_floors": flat_data.get("total_floors", 0),
        "rooms": flat_data.get("rooms", 0),
        "property_type": _map_property_type_from_url(flat_data.get("title", "Недвижимость")),
        "deal_type": _map_deal_type_from_url(url),
        "seller": seller,
        "location": normalized_location,
        "description": flat_data.get("description", ""),
        "property_old": flat_data.get("property_old", "неизвестно"),
        "is_verified": False,
    }


def _map_property_type_from_url(title: str) -> str:
    if re.search(r"\bквартир\w*", title, re.IGNORECASE):
        return "квартира"
    elif re.search(r"\bапартамент\w*", title, re.IGNORECASE):
        return "апартаменты"
    return "unknown"


def _map_deal_type_from_url(url: str) -> str:
    url_lower = url.lower()
    if '/sale/' in url_lower or '/prodazha/' in url_lower:
        return "free_sale"
    return "unknown"


async def parse_property_url(url: str) -> Optional[Dict[str, Any]]:
    """Парсит ссылку на недвижимость."""
    if not validate_url(url):
        raise ValueError("Неподдерживаемая ссылка. Используйте ЦИАН")
    platform = detect_platform(url)
    if not platform:
        raise ValueError("Не удалось определить платформу.")
    obj_id = extract_id_from_url(url)
    if not obj_id:
        raise ValueError("Не удалось извлечь ID объекта из ссылки.")
    if config.USE_MOCK_EXTERNAL_API:
        logger.warning("Используем МОК-данные для парсинга (USE_MOCK_EXTERNAL_API=True)")
        return _get_mock_property_data(platform, obj_id, url)
    if platform == "cian":
        try:
            data = _parse_cian_single_listing(url, obj_id)
            logger.info(f"Успешно спарсили объект {obj_id} с ЦИАН")
            return data
        except Exception as e:
            logger.error(f"Ошибка парсинга ЦИАН: {e}")
            raise ParserError(f"Не удалось спарсить объект: {str(e)}")
    else:
        logger.warning(f"Платформа {platform} не поддерживается для реального парсинга, используем мок")
        return _get_mock_property_data(platform, obj_id, url)


def _get_mock_property_data(platform: str, obj_id: str, url: str) -> Dict[str, Any]:
    import random
    return {
        "id": obj_id,
        "platform": platform,
        "url": url,
        "title": f"Недвижимость {random.randint(1, 100)}",
        "address": f"г. Москва, ул. Ленина, д. {random.randint(1, 50)}",
        "price": random.randint(3000000, 25000000),
        "total_area": round(random.uniform(25, 120), 1),
        "living_area": round(random.uniform(12, 80), 1),
        "kitchen_area": round(random.uniform(5, 25), 1),
        "floor": random.randint(1, 15),
        "total_floors": random.randint(5, 25),
        "rooms": random.randint(1, 5),
        "property_type": random.choice(["flat", "house", "room", "land"]),
        "deal_type": random.choice(["free_sale", "alternative", "mortgage"]),
        "seller": {
            "name": random.choice(["Иванов Иван Иванович", "Петров Петр Петрович", "Сидорова Анна Сергеевна"]),
            "phone": f"+7 (900) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}",
            "type": random.choice(["owner", "agency", "developer"]),
            "company_name": "",
            "inn": None,
        },
        "location": {
            "lat": round(55.75 + random.random() * 0.1, 6),
            "lon": round(37.6 + random.random() * 0.1, 6),
            "address": f"г. Москва, ул. Ленина, д. {random.randint(1, 50)}"
        },
        "description": "Отличная квартира в центре города.",
        "is_verified": False,
    }


if __name__ == "__main__":
    with open('flat_data.json', 'a+', encoding='utf-8') as f:
        parser = CianListingParser()
        # json.dump(_parse_cian_single_listing("https://www.cian.ru/sale/flat/327960213/?context=4.acmm5-RoIg8._W-2OYSz1vykZI0bwLc0-UgpxjdULRS3r7S5Ma_wAahLw3cS58yA2xM41Ahqi7HMyy3vLaN3UXuTmA&mlSearchSessionGuid=98a159afde7f6599110dfa7464114f97", 327960213), f, ensure_ascii=False, indent=2)
        json.dump(parse_property_url("https://mytishchi.cian.ru/sale/flat/322363634/?mlSearchSessionGuid=83b6624852f6a36c3a1bbd99a605c123&context=4.Yys7SlrkLUA.Aq29qE6cx6AlIXRTk1awbmJ9uwgIVdycj9cNJbpzzF4Ypn7Tg_u_BH_843Ozue7UQWsZBghNBew9nbhHhhzi_sA7O3f9N3dxfzqTxPw4IHY_tHpg"), f, ensure_ascii=False, indent=2)


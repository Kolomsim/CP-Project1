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


def _extract_property_old_from_offer(offer_data: Dict[str, Any]) -> Optional[str]:
    """Достаёт «Тип жилья» (вторичка/новостройка) из структуры оффера CIAN."""
    candidates: list[Any] = []

    for key in ('facts', 'factoids', 'features', 'generalInfo', 'aboutHome', 'objectInfo'):
        value = offer_data.get(key)
        if isinstance(value, list):
            candidates.extend(value)
        elif isinstance(value, dict):
            candidates.append(value)

    extra = offer_data.get('extraData') or {}
    if isinstance(extra, dict):
        for key in ('facts', 'factoids', 'features'):
            value = extra.get(key)
            if isinstance(value, list):
                candidates.extend(value)

    for item in candidates:
        if not isinstance(item, dict):
            continue
        label = str(
            item.get('label')
            or item.get('name')
            or item.get('title')
            or item.get('key')
            or ''
        ).lower()
        if 'тип жилья' not in label and label not in ('flattype', 'propertytype', 'housetype'):
            continue
        value = item.get('value') or item.get('text') or item.get('title')
        if value:
            return str(value).strip()

    # Иногда CIAN кладёт категории в breadcrumbs / category path
    for key in ('breadCrumbs', 'breadcrumbs', 'category'):
        crumbs = offer_data.get(key)
        text = ''
        if isinstance(crumbs, list):
            text = ' '.join(str(c.get('title') or c.get('name') or c) for c in crumbs if c)
        elif isinstance(crumbs, str):
            text = crumbs
        lower = text.lower()
        if 'новостр' in lower or 'первич' in lower:
            return 'Новостройка'
        if 'втор' in lower:
            return 'Вторичка'

    return None


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
    
    def _extract_data(self, soup: BeautifulSoup, html: str, url: str) -> Dict[str, Any]:
        """Извлекает данные из HTML"""
        data = {}
        
        # 1. Извлекаем из __NEXT_DATA__ (основной источник - полная информация)
        next_data = self._extract_from_next_data(soup)
        data.update(next_data)
        
        # 2. Извлекаем из JSON-LD (цена, название, описание)
        json_ld_data = self._extract_from_json_ld(soup)
        data.update(json_ld_data)
        
        # 3. Извлекаем из встроенного JSON в script тегах (аналитика)
        inline_json_data = self._extract_from_inline_json(soup, html)
        data.update(inline_json_data)
        
        # 4. Извлекаем из OpenGraph мета-тегов (этаж, комнаты, адрес)
        og_data = self._extract_from_opengraph(soup)
        data.update(og_data)
        
        # 5. Извлекаем из HTML разметки (дополнительные данные)
        html_data = self._extract_from_html(soup, html, url)
        data.update(html_data)

        # 6. Fallback: новый формат страниц ЦИАН (window._cianConfig)
        cian_config_data = self._extract_from_cian_config(html)
        self._merge_cian_config_data(data, cian_config_data)
        
        return data
    
    def _extract_from_next_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Извлекает данные из __NEXT_DATA__ (основной источник информации о продавце)"""
        data = {}
        
        script = soup.find('script', id='__NEXT_DATA__')
        if not script or not script.string:
            return data
        
        try:
            json_data = json.loads(script.string)
            props = json_data.get('props', {})
            page_props = props.get('pageProps', {})
            
            # Пробуем разные пути к данным (структура может меняться)
            offer_data = None
            
            # Путь 1: bffData.offer
            bff_data = page_props.get('bffData', {})
            if bff_data:
                offer_data = bff_data.get('offer', {})
            
            # Путь 2: initialState.offerData.offer
            if not offer_data:
                initial_state = page_props.get('initialState', {})
                offer_data_wrapper = initial_state.get('offerData', {})
                offer_data = offer_data_wrapper.get('offer', {})
            
            # Путь 3: initialData.offerData.offer
            if not offer_data:
                initial_data = page_props.get('initialData', {})
                offer_data_wrapper = initial_data.get('offerData', {})
                offer_data = offer_data_wrapper.get('offer', {})
            
            if not offer_data:
                return data
            
            # Извлекаем основную информацию
            data['total_area'] = float(offer_data.get('totalArea', 0) or 0)
            data['living_area'] = float(offer_data.get('livingArea', 0) or 0)
            data['kitchen_area'] = float(offer_data.get('kitchenArea', 0) or 0)
            data['floor'] = offer_data.get('floorNumber', 0) or 0
            data['rooms'] = offer_data.get('roomsCount', 0) or 0
            
            # Этажность здания
            building = offer_data.get('building', {})
            if building:
                data['total_floors'] = building.get('floorsTotal', 0) or 0

            # Тип жилья (вторичка/новостройка) из фактов оффера
            property_old = _extract_property_old_from_offer(offer_data)
            if property_old:
                data['property_old'] = property_old
            
            # Описание
            if not data.get('description'):
                data['description'] = offer_data.get('description', '')
            
            # Цена
            bargain_terms = offer_data.get('bargainTerms', {})
            if bargain_terms:
                price = bargain_terms.get('price')
                if price:
                    data['price'] = int(price)
            
            # Адрес и гео
            geo = offer_data.get('geo', {})
            if geo:
                address_string = geo.get('addressString', '')
                if address_string:
                    data['address'] = address_string
                    if 'location' not in data:
                        data['location'] = {}
                    data['location']['address'] = address_string
                
                coordinates = geo.get('coordinates', {})
                if coordinates:
                    if 'location' not in data:
                        data['location'] = {}
                    data['location']['lat'] = coordinates.get('lat', 0.0)
                    data['location']['lon'] = coordinates.get('lng', 0.0)
            
            # ===== ИНФОРМАЦИЯ О ПРОДАВЦЕ =====
            # Ищем в разных местах
            agent_data = None
            
            # Путь 1: offer.agent
            if 'agent' in offer_data:
                agent_data = offer_data['agent']
            
            # Путь 2: offer.seller
            if not agent_data and 'seller' in offer_data:
                agent_data = offer_data['seller']
            
            # Путь 3: bffData.agent (отдельный блок)
            if not agent_data and bff_data and 'agent' in bff_data:
                agent_data = bff_data['agent']
            
            # Путь 4: offerData.agent
            if not agent_data:
                initial_state = page_props.get('initialState', {})
                offer_data_wrapper = initial_state.get('offerData', {})
                if 'agent' in offer_data_wrapper:
                    agent_data = offer_data_wrapper['agent']
            
            if agent_data:
                if 'seller' not in data:
                    data['seller'] = {}
                
                # Имя продавца
                name = agent_data.get('name') or agent_data.get('displayName') or agent_data.get('agentName')
                if name:
                    data['seller']['name'] = name
                
                # Телефон
                phone = agent_data.get('phone') or agent_data.get('phones', [None])[0] if isinstance(agent_data.get('phones'), list) else agent_data.get('phone')
                if phone:
                    data['seller']['phone'] = phone
                
                # Тип продавца (собственник/агентство/застройщик)
                seller_type = agent_data.get('type') or agent_data.get('agentType') or agent_data.get('sellerType')
                if seller_type:
                    data['seller']['type'] = self._map_seller_type(seller_type)
                
                # ID агента/компании
                agent_id = agent_data.get('id') or agent_data.get('agentId')
                if agent_id:
                    data['seller']['id'] = agent_id
                
                # Название компании (если продает агентство/застройщик)
                company_name = agent_data.get('organizationName') or agent_data.get('companyName')
                if company_name:
                    data['seller']['company_name'] = company_name
                
                # Фото агента
                avatar = agent_data.get('avatarUrl') or agent_data.get('photo')
                if avatar:
                    data['seller']['avatar_url'] = avatar
            
        except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
            logger.debug(f"Ошибка при разборе __NEXT_DATA__: {e}")
        
        return data

    def _extract_from_cian_config(self, html: str) -> Dict[str, Any]:
        """Извлекает данные из window._cianConfig (новый формат страниц ЦИАН)"""
        data: Dict[str, Any] = {}

        coord_match = re.search(
            r'"coordinates"\s*:\s*\{\s*"lat"\s*:\s*([0-9.+-]+)\s*,\s*"(?:lng|lon)"\s*:\s*([0-9.+-]+)\s*\}',
            html,
        )
        if coord_match:
            lat = float(coord_match.group(1))
            lon = float(coord_match.group(2))
            if lat != 0 or lon != 0:
                data['location'] = {
                    'lat': lat,
                    'lon': lon,
                }

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
                if 'location' not in data:
                    data['location'] = {}
                data['location']['address'] = address

        # Тип жилья: вторичка / новостройка (поле CIAN "Тип жилья")
        # Важно: матчим только внутри одного JSON-объекта, иначе value
        # подтягивается от соседнего факта («Общая площадь» и т.п.).
        property_old = None
        for pattern in (
            r'\{\s*"value"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"Тип жилья"\s*\}',
            r'\{\s*"label"\s*:\s*"Тип жилья"\s*,\s*"value"\s*:\s*"([^"]+)"\s*\}',
            r'"value"\s*:\s*"(Новостройка|Вторичка|Первичный рынок|Вторичный рынок)"\s*,\s*"label"\s*:\s*"Тип жилья"',
            r'"label"\s*:\s*"Тип жилья"\s*,\s*"value"\s*:\s*"(Новостройка|Вторичка|Первичный рынок|Вторичный рынок)"',
        ):
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                if _map_market_category(candidate):
                    property_old = candidate
                    break

        data['property_old'] = property_old or 'неизвестно'

        return data

    def _merge_cian_config_data(self, data: Dict[str, Any], cian_data: Dict[str, Any]) -> None:
        """Дополняет данные из _cianConfig, если основные источники не дали координаты"""
        if not cian_data:
            return

        location = data.get('location') or {}
        cian_location = cian_data.get('location') or {}

        lat = float(location.get('lat') or 0)
        lon = float(location.get('lon') or 0)
        has_valid_coords = (lat != 0 or lon != 0) and abs(lat) <= 90 and abs(lon) <= 180

        if not has_valid_coords and cian_location:
            data['location'] = {**location, **cian_location}
        elif cian_location.get('address') and not location.get('address'):
            data.setdefault('location', {})['address'] = cian_location['address']

        if not data.get('address') and cian_data.get('address'):
            data['address'] = cian_data['address']

        if cian_data.get('property_old') and (
            not data.get('property_old') or data.get('property_old') == 'неизвестно'
        ):
            data['property_old'] = cian_data['property_old']
    
    def _extract_from_json_ld(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Извлекает данные из JSON-LD разметки (Product)"""
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
        """Извлекает данные из встроенных JSON в script тегах (аналитика)"""
        data = {}
        
        # Ищем скрипт с аналитикой (содержит offerPhone, breadCrumbs, price)
        scripts = soup.find_all('script')
        
        for script in scripts:
            if script.string and 'offerPhone' in script.string:
                try:
                    match = re.search(r'var\s+i\s*=\s*({.*?});', script.string, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        json_data = json.loads(json_str)
                        
                        page = json_data.get('page', {})
                        
                        # Телефон из аналитики (резервный источник)
                        if 'offerPhone' in page:
                            if 'seller' not in data:
                                data['seller'] = {}
                            if not data['seller'].get('phone'):
                                data['seller']['phone'] = page['offerPhone']
                        
                        # Тип продавца из аналитики
                        if 'offerAgentType' in page:
                            if 'seller' not in data:
                                data['seller'] = {}
                            if not data['seller'].get('type'):
                                data['seller']['type'] = self._map_seller_type(page['offerAgentType'])
                        
                        # Имя продавца из аналитики
                        if 'offerAgentName' in page:
                            if 'seller' not in data:
                                data['seller'] = {}
                            if not data['seller'].get('name'):
                                data['seller']['name'] = page['offerAgentName']
                        
                        # Хлебные крошки (адрес)
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
                        
                        # Цена из products
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
        """Извлекает данные из HTML разметки (резервный метод)"""
        data = {}
        page_text = soup.get_text()
        
        # Площадь
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
        
        # Комнаты
        if not data.get('rooms') or data.get('rooms') == 0:
            rooms_match = re.search(r'(\d+)\s*комн', page_text, re.IGNORECASE)
            if rooms_match:
                data['rooms'] = int(rooms_match.group(1))
        
        # Этаж
        if not data.get('floor') or data.get('floor') == 0:
            floor_match = re.search(r'(\d+)\s*этаж.*?из\s*(\d+)', page_text, re.IGNORECASE)
            if floor_match:
                data['floor'] = int(floor_match.group(1))
                data['total_floors'] = int(floor_match.group(2))
        
        # ===== ИЗВЛЕЧЕНИЕ ИНФОРМАЦИИ О ПРОДАВЦЕ ИЗ HTML =====
        if 'seller' not in data:
            data['seller'] = {}
        
        # Ищем блок с информацией о продавце
        # Вариант 1: Блок с классом AgentCard или OfferCardAgent
        agent_card = soup.find('div', class_=re.compile(r'agent-card|AgentCard|offer-card-agent|BrokerCard', re.IGNORECASE)) or \
                     soup.find('div', {'data-testid': re.compile(r'agent|seller|broker', re.IGNORECASE)})
        
        if agent_card:
            # Имя продавца
            if not data['seller'].get('name'):
                name_elem = agent_card.find(['span', 'div', 'a'], class_=re.compile(r'name|agent-name', re.IGNORECASE))
                if name_elem:
                    data['seller']['name'] = name_elem.get_text(strip=True)
            
            # Тип продавца (Собственник, Агентство, Застройщик)
            if not data['seller'].get('type'):
                type_elem = agent_card.find(['span', 'div'], class_=re.compile(r'type|agent-type|seller-type', re.IGNORECASE))
                if type_elem:
                    seller_type_text = type_elem.get_text(strip=True).lower()
                    data['seller']['type'] = self._map_seller_type_from_text(seller_type_text)
                
                # Альтернативный поиск типа по тексту
                if not data['seller'].get('type'):
                    agent_text = agent_card.get_text()
                    if 'собственник' in agent_text.lower():
                        data['seller']['type'] = 'owner'
                    elif 'агентство' in agent_text.lower() or 'риелтор' in agent_text.lower():
                        data['seller']['type'] = 'agency'
                    elif 'застройщик' in agent_text.lower() or 'developer' in agent_text.lower():
                        data['seller']['type'] = 'developer'
        
        # Вариант 2: Прямой поиск элементов с информацией о продавце
        if not data['seller'].get('name'):
            name_elem = soup.find(['span', 'div'], class_=re.compile(r'agent.*name|seller.*name|agent-name|BrokerName', re.IGNORECASE))
            if name_elem:
                data['seller']['name'] = name_elem.get_text(strip=True)
        
        # Вариант 3: Поиск в JSON внутри HTML (data-* атрибуты)
        if not data['seller'].get('phone'):
            # Ищем телефон в data-атрибутах
            phone_elem = soup.find(attrs={'data-phone': True})
            if phone_elem:
                data['seller']['phone'] = phone_elem['data-phone']
            
            # Или ищем телефон в скриптах через regex
            if not data['seller'].get('phone'):
                phone_match = re.search(r'"offerPhone"\s*:\s*"([^"]+)"', html)
                if phone_match:
                    data['seller']['phone'] = phone_match.group(1)
        
        # Вариант 4: Поиск в link rel="alternate" или других мета-тегах
        if not data['seller'].get('name'):
            # Ищем в специальных блоках
            seller_info = soup.find('div', class_=re.compile(r'BrokerInfo|AgentInfo|SellerInfo', re.IGNORECASE))
            if seller_info:
                name_elem = seller_info.find(['span', 'div', 'a'])
                if name_elem:
                    data['seller']['name'] = name_elem.get_text(strip=True)
        
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
            
            'developer': 'developer',
            'застройщик': 'developer',
            'builder': 'developer',
        }
        
        return mapping.get(seller_type_lower, 'unknown')
    
    def _map_seller_type_from_text(self, text: str) -> str:
        """Определяет тип продавца по тексту"""
        text_lower = text.lower()
        
        if 'собственник' in text_lower or 'owner' in text_lower:
            return 'owner'
        elif 'агентство' in text_lower or 'риелтор' in text_lower or 'агент' in text_lower:
            return 'agency'
        elif 'застройщик' in text_lower or 'developer' in text_lower:
            return 'developer'
        
        return 'unknown'
    
    def _parse_price(self, price_str: str) -> int:
        """Парсит строку с ценой"""
        if not price_str:
            return 0
        
        digits = re.sub(r'[^\d]', '', str(price_str))
        return int(digits) if digits else 0


def _parse_cian_single_listing(url: str, obj_id: str) -> Dict[str, Any]:
    """
    Парсит отдельное объявление ЦИАН по URL.
    """
    logger.info(f"Парсинг отдельного объявления ЦИАН: ID {obj_id}, URL: {url}")
    
    parser = CianListingParser()
    flat_data = parser.parse_listing(url)
    
    # Формируем информацию о продавце с дефолтными значениями
    seller_data = flat_data.get("seller", {})
    seller = {
        "name": seller_data.get("name", "Неизвестно"),
        "phone": seller_data.get("phone", ""),
        "type": seller_data.get("type", "unknown"),  # owner, agency, developer, unknown
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

    property_old, market_category = _resolve_market_category(flat_data, url)

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
        "property_type": _map_property_type_from_url(url),
        "deal_type": _map_deal_type_from_url(url),
        "seller": seller,
        "location": normalized_location,
        "description": flat_data.get("description", ""),
        "property_old": property_old,
        "market_category": market_category,
        "is_verified": False,
    }


def _map_property_type_from_url(url: str) -> str:
    """Определяет тип недвижимости из URL"""
    url_lower = url.lower()
    if '/flat/' in url_lower or '/kvartira/' in url_lower:
        return "flat"
    elif '/house/' in url_lower or '/dom/' in url_lower:
        return "house"
    return "unknown"


def _map_deal_type_from_url(url: str) -> str:
    """Определяет тип сделки из URL"""
    url_lower = url.lower()
    if '/sale/' in url_lower or '/prodazha/' in url_lower:
        return "free_sale"
    return "unknown"


def _map_market_category(property_old: Optional[str]) -> str:
    """Нормализует CIAN «Тип жилья» (property_old) в новостройка/вторичка."""
    if not property_old:
        return ""

    value = property_old.strip().lower().replace("\xa0", " ")
    if value in ("неизвестно", "unknown", ""):
        return ""
    # Отсекаем ложные матчи вроде «40,6 м²»
    if any(token in value for token in ("м²", "м2", "₽", "руб", "%")):
        return ""
    if re.search(r"\d", value) and "новостр" not in value and "втор" not in value and "первич" not in value:
        return ""
    if "новостр" in value or "первич" in value:
        return "новостройка"
    if "втор" in value:
        return "вторичка"
    return ""


def _resolve_market_category(flat_data: Dict[str, Any], url: str = "") -> tuple[str, str]:
    """Возвращает (property_old, market_category) с эвристиками по данным объявления."""
    property_old = flat_data.get("property_old") or ""
    market_category = _map_market_category(property_old)
    if market_category:
        return property_old or market_category, market_category

    seller = flat_data.get("seller") or {}
    seller_type = str(seller.get("type") or "").lower()
    company = str(seller.get("company_name") or "").lower()
    searchable = " ".join(
        [
            str(flat_data.get("title") or ""),
            str(flat_data.get("description") or ""),
            str(seller.get("name") or ""),
            company,
            url or str(flat_data.get("url") or ""),
        ]
    ).lower()

    if (
        seller_type == "developer"
        or "застройщик" in searchable
        or "новострой" in searchable
        or "жк " in searchable
        or "жилой комплекс" in searchable
        or any(token in searchable for token in ("/newbuilding", "/newobjects", "/jk/", "novostroy"))
    ):
        return "Новостройка", "новостройка"

    if "втор" in searchable and "рынок" in searchable:
        return "Вторичка", "вторичка"

    return property_old or "неизвестно", ""


# Главная функция
def parse_property_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Парсит ссылку на недвижимость.
    """
    # 1. Валидация
    if not validate_url(url):
        raise ValueError("Неподдерживаемая ссылка. Используйте ЦИАН, Авито, Домклик.")

    platform = detect_platform(url)
    if not platform:
        raise ValueError("Не удалось определить платформу.")

    obj_id = extract_id_from_url(url)
    if not obj_id:
        raise ValueError("Не удалось извлечь ID объекта из ссылки.")

    # 2. Если включены моки — возвращаем заглушку
    if config.USE_MOCK_EXTERNAL_API:
        logger.warning("Используем МОК-данные для парсинга (USE_MOCK_EXTERNAL_API=True)")
        return _get_mock_property_data(platform, obj_id, url)

    # 3. Реальный парсинг (только для ЦИАН)
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
    """Возвращает тестовые данные"""
    import random
    property_old = random.choice(["Вторичка", "Новостройка"])
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
        "property_old": property_old,
        "market_category": _map_market_category(property_old),
        "is_verified": False,
    }


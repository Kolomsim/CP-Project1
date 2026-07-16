# app/api/deal.py

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

# from app.models import (
#     BuyerInfoRequest,
#     BuyerInfoResponse,
#     PropertyInfoRequest,
#     # PropertyPreviewResponse,
#     CheckRisksResponse,
# )
from app.models.property import PropertyPreviewResponse
from app.models.risks import CheckRisksResponse
from app.models.buyer import BuyerInfoRequest, BuyerInfoResponse
from app.models.property import PropertyInfoRequest
from app.services.session_manager import create_session, update_session, get_session
from app.services.property_parser import parse_property_url, ParserError as PropertyParserError
from app.services.risk_checker import check_all_risks
from app.services.nalog_parser import analyze_company_auto_answers
from app.api.dependencies import get_session_data
from app.api.exceptions import BusinessError, ParserError, ExternalAPITimeoutError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/deal", tags=["Deal"])

@router.post(
    "/buyer-info",
    response_model=BuyerInfoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Шаг 1: Сохранение информации о покупателе",
)
async def save_buyer_info(request: BuyerInfoRequest):
    """
    Принимает данные о покупателе (гражданство, семейное положение, способ покупки).
    Создаёт новую сессию и сохраняет данные.
    Возвращает session_id для следующих шагов.
    """
    try:
        # Создаём новую сессию
        session_id = create_session()
        # Сохраняем данные покупателя
        update_session(session_id, {"buyer_info": request.model_dump(mode="json")})
        logger.info(f"Создана сессия {session_id} для покупателя")
        return BuyerInfoResponse(
            success=True,
            session_id=session_id,
            next_step="/api/deal/property-info",
            message="Данные сохранены. Переходите к шагу 2."
        )
    except Exception as e:
        logger.error(f"Ошибка при сохранении данных покупателя: {e}")
        raise BusinessError("Не удалось сохранить данные. Попробуйте позже.")


@router.post(
    "/property-info",
    response_model=PropertyPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Шаг 2: Получение предпросмотра объекта по ссылке",
)
async def get_property_preview(request: PropertyInfoRequest):
    """
    Принимает ссылку на объект недвижимости.
    Парсит данные и возвращает предпросмотр для подтверждения.
    """
    try:
        # Проверяем, что сессия существует
        session_data = await get_session_data(request.session_id)

        # Парсим ссылку (асинхронно)
        try:
            property_data = parse_property_url(str(request.url))
        except ValueError as e:
            raise ParserError(str(e))
        except PropertyParserError as e:
            raise ParserError(str(e))
        except Exception as e:
            error_text = str(e).lower()
            logger.error(f"Ошибка парсинга ссылки {request.url}: {e}")
            if "timed out" in error_text or "timeout" in error_text:
                raise ParserError("ЦИАН не отвечает. Подождите минуту и попробуйте снова.")
            raise ParserError("Не удалось загрузить данные с ЦИАН. Попробуйте ещё раз через минуту.")

        # Если продавец — застройщик, ищем данные в ФНС
        seller = property_data.get("seller", {})
        seller_type = seller.get("type", "")
        company_name = seller.get("company_name", "")

        if seller_type == "developer" and company_name and company_name not in ("", "Неизвестно"):
            try:
                from app.services.nalog_parser import search_company as search_nalog_company
                nalog_info = await search_nalog_company(company_name)
                if nalog_info:
                    # Обогащаем данные продавца информацией из ФНС
                    if nalog_info.inn:
                        property_data["seller"]["inn"] = nalog_info.inn
                    if nalog_info.ogrn:
                        property_data["seller"]["ogrn"] = nalog_info.ogrn
                    if nalog_info.full_name:
                        property_data["seller"]["full_name"] = nalog_info.full_name
                    if nalog_info.status:
                        property_data["seller"]["nalog_status"] = nalog_info.status
                    if nalog_info.registration_date:
                        property_data["seller"]["registration_date"] = nalog_info.registration_date
                    if nalog_info.region:
                        property_data["seller"]["region"] = nalog_info.region
                    if nalog_info.okved:
                        property_data["seller"]["okved"] = nalog_info.okved
                    logger.info(
                        f"Данные из ФНС для {company_name}: "
                        f"ИНН={nalog_info.inn}, статус={nalog_info.status}"
                    )
            except Exception as e:
                logger.warning(f"Не удалось получить данные из ФНС для {company_name}: {e}")

        # Сохраняем данные объекта в сессию
        update_session(request.session_id, {"property_data": property_data})

        # Возвращаем предпросмотр
        return PropertyPreviewResponse(**property_data)

    except BusinessError:
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка в /property-info: {e}", exc_info=True)
        raise BusinessError("Не удалось обработать ссылку. Проверьте корректность URL.")


@router.post(
    "/check-risks",
    response_model=CheckRisksResponse,
    status_code=status.HTTP_200_OK,
    summary="Шаг 3: Проверка рисков и формирование отчёта",
)
async def check_risks(session_id: str):
    """
    Запускает комплексную проверку рисков на основе данных, сохранённых в сессии.
    Возвращает итоговый рейтинг, список проблем и чек-лист документов.
    """
    try:
        # Получаем данные сессии
        session_data = await get_session_data(session_id)
        buyer_info = session_data.get("buyer_info")
        property_data = session_data.get("property_data")

        if not buyer_info:
            raise BusinessError("Не найдены данные покупателя. Пройдите шаг 1.")
        if not property_data:
            raise BusinessError("Не найдены данные объекта. Пройдите шаг 2.")

        # Извлекаем необходимые данные для проверки
        address = property_data.get("address")
        seller = property_data.get("seller", {})
        seller_name = seller.get("name")
        inn = seller.get("inn")
        company_name = seller.get("company_name")
        cadastral_number = property_data.get("cadastral_number")  # может быть None

        # Запускаем асинхронную проверку всех рисков
        try:
            result = await check_all_risks(
                address=address,
                seller_name=seller_name,
                inn=inn,
                company_name=company_name,
                cadastral_number=cadastral_number,
                buyer_info=buyer_info,
                property_data=property_data,
            )
        except Exception as e:
            logger.error(f"Ошибка при проверке рисков: {e}")
            raise ExternalAPITimeoutError("проверка рисков")

        # Добавляем детали объекта в ответ
        result["property_details"] = {
            "address": address,
            "price": property_data.get("price"),
            "total_area": property_data.get("total_area"),
            "living_area": property_data.get("living_area"),
            "kitchen_area": property_data.get("kitchen_area"),
            "floor": property_data.get("floor"),
            "rooms": property_data.get("rooms"),
            "property_type": property_data.get("property_type"),
            "deal_type": property_data.get("deal_type"),
            "market_category": property_data.get("market_category") or property_data.get("property_old"),
            "seller": seller_name,
        }

        # Сохраняем результат в сессию (на всякий случай)
        update_session(session_id, {"result": result})

        return CheckRisksResponse(**result)

    except Exception as e:
        if isinstance(e, BusinessError):
            raise
        logger.error(f"Неожиданная ошибка в /check-risks: {e}", exc_info=True)
        raise BusinessError("Не удалось выполнить проверку. Попробуйте позже.")


# --- Модели для полуавтоматической проверки застройщика ---

class AutoAnswer(BaseModel):
    """Автоматический ответ на вопрос чек-листа"""
    value: str = Field(..., description="Ответ: yes или no", pattern="^(yes|no)$")
    source: str = Field(..., description="Источник данных")
    details: Optional[str] = Field(None, description="Пояснение")

class DeveloperCheckRequest(BaseModel):
    session_id: str = Field(..., description="ID сессии")

class DeveloperCheckResponse(BaseModel):
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    ogrn: Optional[str] = Field(None, description="ОГРН")
    status: Optional[str] = Field(None, description="Статус организации")
    registration_date: Optional[str] = Field(None, description="Дата регистрации")
    region: Optional[str] = Field(None, description="Регион")
    okved: Optional[str] = Field(None, description="Основной ОКВЭД")
    auto_answers: Dict[str, AutoAnswer] = Field(
        default_factory=dict,
        description="Автоматические ответы на вопросы чек-листа",
    )


@router.post(
    "/developer-check",
    response_model=DeveloperCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Получить автоматические ответы для чек-листа застройщика",
)
async def get_developer_check(request: DeveloperCheckRequest):
    """
    Анализирует данные компании из ФНС, сохранённые в сессии,
    и возвращает автоматические ответы на вопросы чек-листа застройщика.
    """
    try:
        session_data = await get_session_data(request.session_id)
        property_data = session_data.get("property_data", {})
        seller = property_data.get("seller", {})
        
        company_name = seller.get("company_name")
        if not company_name:
            return DeveloperCheckResponse()
        
        # Собираем данные из ФНС, которые уже сохранены в сессии
        nalog_info_dict = {
            "inn": seller.get("inn"),
            "ogrn": seller.get("ogrn"),
            "short_name": company_name,
            "full_name": seller.get("full_name"),
            "status": seller.get("nalog_status"),
            "registration_date": seller.get("registration_date"),
            "region": seller.get("region"),
            "okved": seller.get("okved"),
        }
        
        # Создаём NalogCompanyInfo для анализа
        from app.models.nalog import NalogCompanyInfo
        nalog_info = NalogCompanyInfo(**{k: v for k, v in nalog_info_dict.items() if v is not None})
        
        # Анализируем и получаем автоматические ответы
        auto_answers = await analyze_company_auto_answers(nalog_info)
        
        return DeveloperCheckResponse(
            company_name=company_name,
            inn=seller.get("inn"),
            ogrn=seller.get("ogrn"),
            status=seller.get("nalog_status"),
            registration_date=seller.get("registration_date"),
            region=seller.get("region"),
            okved=seller.get("okved"),
            auto_answers=auto_answers,
        )
        
    except Exception as e:
        logger.error(f"Ошибка в /developer-check: {e}", exc_info=True)
        return DeveloperCheckResponse()
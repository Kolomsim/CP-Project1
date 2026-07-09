# app/api/deal.py

import logging
from fastapi import APIRouter, Depends, status

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
        seller_name = property_data.get("seller", {}).get("name")
        inn = property_data.get("seller", {}).get("inn")
        cadastral_number = property_data.get("cadastral_number")  # может быть None

        # Запускаем асинхронную проверку всех рисков
        try:
            result = await check_all_risks(
                address=address,
                seller_name=seller_name,
                inn=inn,
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
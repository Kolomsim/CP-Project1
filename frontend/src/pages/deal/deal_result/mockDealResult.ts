import { DEMO_PROPERTY } from '../deal_object/mockPropertyParser'
import type { DealCheckResult } from './types'

/**
 * Заглушка результата проверки.
 * TODO: заменить на запрос к бэкенду:
 * POST /api/deal/check-risks?session_id={sessionId}
 */
export async function fetchDealCheckResult(sessionId?: string): Promise<DealCheckResult> {
  void sessionId

  await new Promise((resolve) => setTimeout(resolve, 700))

  return {
    overallRating: 'Обратите внимание',
    problems: [
      {
        type: 'bankruptcy',
        severity: 'высокий',
        title: 'Владелец найден в реестре банкротства',
        description:
          'Покупка недвижимости у банкрота связана с риском оспаривания сделки арбитражным управляющим.',
        recommendation: 'Узнайте, чем грозит банкротство продавца и как минимизировать риски.',
        articleLink: '/kb',
        details: 'Дело № А40-123456/2024, статус: конкурсное производство',
      },
      {
        type: 'realtor_rating',
        severity: 'средний',
        title: 'Низкий рейтинг риелтора',
        description:
          'Низкий рейтинг может указывать на участие агента в сомнительных сделках.',
        recommendation: 'Рекомендуем прочитать инструкцию по безопасной работе с агентствами недвижимости.',
        articleLink: '/kb',
      },
    ],
    property: DEMO_PROPERTY,
    riskCount: 2,
    criticalCount: 1,
    checkDate: new Date().toISOString(),
  }
}

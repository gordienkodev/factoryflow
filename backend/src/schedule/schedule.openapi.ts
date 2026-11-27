import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { downtimeResponse } from '../downtimes/downtimes.openapi.js';
import { internalServerError } from '../lib/http-errors.js';
import { machineId } from '../machines/machines.openapi.js';
import { operationResponse } from '../operations/operations.openapi.js';

export const schedulePath = '/api/schedule';
export const scheduleQuery = z.object({
  date: z.iso.date().meta({ example: '2026-11-27' }),
});

const scheduleResponse = z.object({
  date: z.iso.date(),
  machines: z.array(z.object({ id: machineId, name: z.string() })),
  operations: z.array(operationResponse),
  downtimes: z.array(downtimeResponse),
});

const order = {
  id: 5,
  number: 'O-105',
  name: 'Точение вала',
  status: 'pending',
} as const;
const scheduleExample = {
  date: '2026-11-27',
  machines: [
    { id: 1, name: 'Токарный станок' },
    { id: 2, name: 'Фрезерный станок' },
    { id: 3, name: 'Шлифовальный станок' },
  ],
  operations: [
    {
      id: 42,
      machineId: 2,
      orderId: order.id,
      startTime: '2026-11-27T06:00:00.000Z',
      endTime: '2026-11-27T08:00:00.000Z',
      order,
    },
    {
      id: 43,
      machineId: 1,
      orderId: order.id,
      startTime: '2026-11-27T11:00:00.000Z',
      endTime: '2026-11-27T13:00:00.000Z',
      order,
    },
  ],
  downtimes: [
    {
      id: 7,
      machineId: 2,
      reason: 'Плановое техобслуживание',
      type: 'MAINTENANCE',
      startTime: '2026-11-27T08:00:00.000Z',
      endTime: '2026-11-27T10:00:00.000Z',
    },
  ],
} satisfies z.infer<typeof scheduleResponse>;

const errorResponse = z.object({ error: z.string() });

export function registerScheduleOpenApi(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'get',
    path: schedulePath,
    summary: 'Получить расписание за день',
    description:
      'Дата задаёт календарный день в Europe/Moscow. Возвращаются все активные станки и неактивные станки с операциями или простоями за этот день. Интервалы возвращаются целиком в UTC.',
    request: { query: scheduleQuery },
    responses: {
      200: {
        description: 'Станки, операции и простои за выбранный день',
        content: {
          'application/json': {
            schema: scheduleResponse,
            example: scheduleExample,
          },
        },
      },
      400: {
        description: 'Дата отсутствует или некорректна',
        content: {
          'application/json': {
            schema: errorResponse,
            example: { error: 'Укажите дату в формате YYYY-MM-DD.' },
          },
        },
      },
      500: {
        description: 'Внутренняя ошибка сервера',
        content: {
          'application/json': {
            schema: errorResponse,
            example: internalServerError,
          },
        },
      },
    },
  });
}

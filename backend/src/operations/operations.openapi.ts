import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { internalServerError, invalidJsonError } from "../lib/http-errors.js";
import { machineId } from "../machines/machines.openapi.js";
import { orderId } from "../orders/orders.openapi.js";

export const operationsPath = "/api/operations";
export const operationId = z.number().int().min(1).max(2_147_483_647);

export const createOperationBody = z.object({
    orderId,
    machineId,
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
});

export const updateOperationBody = createOperationBody
    .pick({ machineId: true, startTime: true, endTime: true })
    .partial()
    .strict();

const operationParams = z.object({ id: operationId });
export const operationResponse = z.object({
    id: operationId,
    orderId,
    machineId,
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    order: z.object({
        id: orderId,
        number: z.string(),
        name: z.string(),
        status: z.enum(["pending", "completed"]),
    }),
});

const firstOperationExample = {
    orderId: 5,
    machineId: 2,
    startTime: "2026-11-27T09:00:00+03:00",
    endTime: "2026-11-27T11:00:00+03:00",
} satisfies z.infer<typeof createOperationBody>;

const moveOperationExample = {
    machineId: 3,
    startTime: "2026-11-30T13:00:00+03:00",
    endTime: "2026-11-30T15:00:00+03:00",
} satisfies z.infer<typeof updateOperationBody>;

const operationExample = {
    ...firstOperationExample,
    id: 42,
    startTime: "2026-11-27T06:00:00.000Z",
    endTime: "2026-11-27T08:00:00.000Z",
    order: { id: 5, number: "O-105", name: "Точение вала", status: "pending" },
} satisfies z.infer<typeof operationResponse>;

const errorResponse = z.object({ error: z.string() });
const intervalErrorResponse = z.object({
    code: z.enum(["INVALID_TIME_INTERVAL", "OUTSIDE_WORKING_HOURS"]),
    message: z.string(),
});
const conflictResponse = z.object({
    code: z.enum(["MACHINE_INACTIVE", "OPERATION_OVERLAP", "ORDER_OPERATION_OVERLAP", "DOWNTIME_OVERLAP"]),
    message: z.string(),
});

function errorExample(description: string, example: z.infer<typeof errorResponse>) {
    return {
        description,
        content: { "application/json": { schema: errorResponse, example } },
    };
}

const invalidOperationResponse = {
    description: "Некорректный запрос или интервал операции",
    content: {
        "application/json": {
            schema: z.union([errorResponse, intervalErrorResponse]),
            examples: {
                invalidJson: { value: invalidJsonError },
                invalidInterval: {
                    value: { code: "INVALID_TIME_INTERVAL", message: "Начало должно быть раньше окончания." },
                },
                outsideWorkingHours: {
                    value: { code: "OUTSIDE_WORKING_HOURS", message: "Интервал должен укладываться в один рабочий день с 08:00 до 20:00 по Москве." },
                },
            },
        },
    },
};

const operationConflictResponse = {
    description: "Станок неактивен или интервал пересекается с операцией или простоем",
    content: {
        "application/json": {
            schema: conflictResponse,
            examples: {
                machineInactive: {
                    value: { code: "MACHINE_INACTIVE", message: "Станок неактивен." },
                },
                machineOccupied: {
                    value: { code: "OPERATION_OVERLAP", message: "Станок занят другой операцией." },
                },
                orderOccupied: {
                    value: { code: "ORDER_OPERATION_OVERLAP", message: "По этому заказу уже запланирована работа на это время." },
                },
                downtimeOverlap: {
                    value: { code: "DOWNTIME_OVERLAP", message: "В это время на станке запланирован простой." },
                },
            },
        },
    },
};

const internalErrorResponse = errorExample("Внутренняя ошибка сервера", internalServerError);

export function registerOperationsOpenApi(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "post",
        path: operationsPath,
        summary: "Создать операцию",
        description: "Создаёт один интервал. Чтобы распределить заказ по дням, отправьте отдельный запрос на каждый интервал с тем же orderId. Рабочий день длится с 08:00 до 20:00 по Europe/Moscow. В запросе укажите часовой пояс, в ответе даты возвращаются в UTC.",
        request: {
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: createOperationBody,
                        examples: {
                            firstOperation: { summary: "Первая операция заказа", value: firstOperationExample },
                            nextWorkday: {
                                summary: "Операция того же заказа в другой день",
                                value: { orderId: firstOperationExample.orderId, ...moveOperationExample },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Операция создана",
                content: { "application/json": { schema: operationResponse, example: operationExample } },
            },
            400: invalidOperationResponse,
            404: errorExample("Заказ или станок не найден", { error: "Заказ не найден." }),
            409: operationConflictResponse,
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "patch",
        path: `${operationsPath}/{id}`,
        summary: "Перенести операцию или изменить её длительность",
        description: "Передайте только изменяемые поля. Итоговый интервал должен укладываться в один рабочий день с 08:00 до 20:00 по Europe/Moscow.",
        request: {
            params: operationParams,
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: updateOperationBody,
                        example: moveOperationExample,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Операция обновлена",
                content: {
                    "application/json": {
                        schema: operationResponse,
                        example: {
                            ...operationExample,
                            machineId: moveOperationExample.machineId,
                            startTime: "2026-11-30T10:00:00.000Z",
                            endTime: "2026-11-30T12:00:00.000Z",
                        },
                    },
                },
            },
            400: { ...invalidOperationResponse, description: "Некорректный ID, тело запроса или интервал операции" },
            404: errorExample("Операция, заказ или станок не найдены", { error: "Операция не найдена." }),
            409: operationConflictResponse,
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "delete",
        path: `${operationsPath}/{id}`,
        summary: "Удалить операцию",
        request: { params: operationParams },
        responses: {
            204: { description: "Операция удалена" },
            400: errorExample("Некорректный ID операции", { error: "ID операции должен быть положительным целым числом в диапазоне Int." }),
            404: errorExample("Операция не найдена", { error: "Операция не найдена." }),
            500: internalErrorResponse,
        },
    });
}

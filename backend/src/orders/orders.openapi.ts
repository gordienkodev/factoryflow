import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { internalServerError, invalidJsonError } from "../lib/http-errors.js";

export const ordersPath = "/api/orders";
export const orderId = z.number().int().min(1).max(2_147_483_647);

const orderText = z.string().trim().min(1);
const orderNameMaxLength = 255;
const orderName = orderText.max(orderNameMaxLength);
const orderNumberMaxLength = 10;
const orderNumber = orderText
    .refine((number) => [...number].length <= orderNumberMaxLength)
    .meta({ maxLength: orderNumberMaxLength });

export const createOrderBody = z.object({
    number: orderNumber,
    name: orderName,
});

export const completeOrderBody = z.object({
    status: z.literal("completed"),
});

const orderResponse = z.object({
    id: orderId,
    number: z.string(),
    name: z.string(),
    status: z.enum(["pending", "completed"]),
});

const orderListItemResponse = orderResponse.extend({
    operationsCount: z.number().int().nonnegative().describe("Количество запланированных операций заказа"),
    scheduledDurationMinutes: z.number().nonnegative().describe("Суммарная длительность всех операций заказа в минутах"),
});

const errorResponse = z.object({
    error: z.string(),
});

export const orderErrors = {
    invalidCreate: {
        error: `Укажите непустые номер и название заказа. Номер должен содержать не более ${orderNumberMaxLength} символов, название — не более ${orderNameMaxLength} символов.`,
    },
    duplicateNumber: {
        error: "Заказ с таким номером уже существует.",
    },
    invalidId: {
        error: "ID заказа должен быть положительным целым числом в диапазоне Int.",
    },
    invalidStatus: {
        error: 'Укажите статус "completed".',
    },
    notFound: {
        error: "Заказ не найден.",
    },
};

function errorExample(
    description: string,
    example: z.infer<typeof errorResponse>,
) {
    return {
        description,
        content: {
            "application/json": {
                schema: errorResponse,
                example,
            },
        },
    };
}

const internalErrorResponse = errorExample(
    "Внутренняя ошибка сервера",
    internalServerError,
);

const createExample = {
    number: "O-104",
    name: "Точение вала",
};

const orderExample = {
    id: 1,
    ...createExample,
    status: "pending",
};

const completeExample = {
    status: "completed",
};

export function registerOrdersOpenApi(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "get",
        path: ordersPath,
        summary: "Получить список заказов",
        responses: {
            200: {
                description: "Список заказов в порядке убывания ID",
                content: {
                    "application/json": {
                        schema: z.array(orderListItemResponse),
                        examples: {
                            withOrders: {
                                summary: "Заказы с запланированными операциями и без них",
                                value: [
                                    { ...orderExample, id: 2, number: "O-105", operationsCount: 3, scheduledDurationMinutes: 300 },
                                    { ...orderExample, operationsCount: 0, scheduledDurationMinutes: 0 },
                                ],
                            },
                            empty: {
                                summary: "Пустой список",
                                value: [],
                            },
                        },
                    },
                },
            },
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "post",
        path: ordersPath,
        summary: "Создать заказ",
        request: {
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: createOrderBody,
                        example: createExample,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Заказ создан со статусом pending",
                content: {
                    "application/json": {
                        schema: orderResponse,
                        example: orderExample,
                    },
                },
            },
            400: {
                description: "Некорректный JSON, номер или название заказа",
                content: {
                    "application/json": {
                        schema: errorResponse,
                        examples: {
                            invalidJson: {
                                summary: "Ошибка синтаксиса JSON",
                                value: invalidJsonError,
                            },
                            invalidFields: {
                                summary: "Ошибка в номере или названии",
                                value: orderErrors.invalidCreate,
                            },
                        },
                    },
                },
            },
            409: errorExample(
                "Номер заказа уже используется",
                orderErrors.duplicateNumber,
            ),
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "patch",
        path: `${ordersPath}/{id}`,
        summary: "Отметить заказ выполненным",
        request: {
            params: z.object({ id: orderId }),
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: completeOrderBody,
                        example: completeExample,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Заказ выполнен",
                content: {
                    "application/json": {
                        schema: orderResponse,
                        example: {
                            ...orderExample,
                            ...completeExample,
                        },
                    },
                },
            },
            400: {
                description: "Некорректный ID или тело запроса",
                content: {
                    "application/json": {
                        schema: errorResponse,
                        examples: {
                            invalidId: {
                                summary: "Некорректный ID",
                                value: orderErrors.invalidId,
                            },
                            invalidStatus: {
                                summary: "Некорректный статус",
                                value: orderErrors.invalidStatus,
                            },
                            invalidJson: {
                                summary: "Ошибка синтаксиса JSON",
                                value: invalidJsonError,
                            },
                        },
                    },
                },
            },
            404: errorExample(
                "Заказ не найден",
                orderErrors.notFound,
            ),
            500: internalErrorResponse,
        },
    });
}

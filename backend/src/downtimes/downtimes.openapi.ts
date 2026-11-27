import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { internalServerError } from "../lib/http-errors.js";
import { machineId } from "../machines/machines.openapi.js";

export const downtimesPath = "/api/downtimes";

export const createDowntimeBody = z.object({
    machineId,
    reason: z.string().trim().min(1),
    type: z.enum(["MAINTENANCE", "BREAKDOWN", "OTHER"]),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
});

export const downtimeResponse = createDowntimeBody.extend({
    id: z.number().int().positive(),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
});

const downtimeExample = {
    machineId: 2,
    reason: "Плановое техобслуживание",
    type: "MAINTENANCE",
    startTime: "2026-11-27T10:00:00+03:00",
    endTime: "2026-11-27T12:00:00+03:00",
} satisfies z.infer<typeof createDowntimeBody>;

const errorResponse = z.object({ error: z.string() });

export function registerDowntimesOpenApi(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "post",
        path: downtimesPath,
        summary: "Добавить простой станка",
        description: "Укажите начало и окончание с часовым поясом. Если интервал пересекается с операцией на этом станке, сначала скорректируйте операцию в расписании.",
        request: {
            body: {
                required: true,
                content: { "application/json": { schema: createDowntimeBody, example: downtimeExample } },
            },
        },
        responses: {
            201: {
                description: "Простой создан. Даты возвращаются в UTC.",
                content: {
                    "application/json": {
                        schema: downtimeResponse,
                        example: {
                            ...downtimeExample,
                            id: 7,
                            startTime: "2026-11-27T07:00:00.000Z",
                            endTime: "2026-11-27T09:00:00.000Z",
                        },
                    },
                },
            },
            400: {
                description: "Некорректные данные запроса или временной интервал",
                content: { "application/json": { schema: errorResponse, example: { error: "Начало должно быть раньше окончания." } } },
            },
            404: {
                description: "Станок не найден",
                content: { "application/json": { schema: errorResponse, example: { error: "Станок не найден." } } },
            },
            409: {
                description: "На станке уже запланирована операция в этом интервале",
                content: {
                    "application/json": {
                        schema: z.object({ code: z.literal("OPERATION_OVERLAP"), message: z.string() }),
                        example: { code: "OPERATION_OVERLAP", message: "Станок занят операцией в это время." },
                    },
                },
            },
            500: {
                description: "Внутренняя ошибка сервера",
                content: { "application/json": { schema: errorResponse, example: internalServerError } },
            },
        },
    });
}

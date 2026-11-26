import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { internalServerError } from "../lib/http-errors.js";

export const machinesPath = "/api/machines";
export const machineId = z.number().int().min(1).max(2_147_483_647);

const machineName = z.string().trim().min(1);

export const createMachineBody = z.object({ name: machineName });
export const updateMachineBody = z.object({
    name: machineName.optional(),
    isActive: z.boolean().optional(),
}).refine(({ name, isActive }) => name !== undefined || isActive !== undefined)
    .meta({ minProperties: 1 });

const machineResponse = z.object({
    id: machineId,
    name: z.string(),
    createdAt: z.iso.datetime(),
    isActive: z.boolean(),
});
const machinesResponse = z.array(machineResponse);
const errorResponse = z.object({ error: z.string() });
const internalErrorResponse = {
    description: "Внутренняя ошибка сервера",
    content: { "application/json": { schema: errorResponse, example: internalServerError } },
};

const machineExample = {
    id: 1,
    name: "Станок ЧПУ №1",
    createdAt: "2026-11-24T09:00:00.000Z",
    isActive: true,
};

export function registerMachinesOpenApi(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "get",
        path: machinesPath,
        summary: "Получить список станков",
        responses: {
            200: {
                description: "Станки от новых к старым. При одинаковой дате создания первым идёт станок с большим ID.",
                content: {
                    "application/json": {
                        schema: machinesResponse,
                        examples: {
                            withMachines: { summary: "Список со станком", value: [machineExample] },
                            empty: { summary: "Пустой список", value: [] },
                        },
                    },
                },
            },
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "post",
        path: machinesPath,
        summary: "Создать станок",
        request: {
            body: {
                required: true,
                content: {
                    "application/json": { schema: createMachineBody, example: { name: machineExample.name } },
                },
            },
        },
        responses: {
            201: {
                description: "Станок создан",
                content: { "application/json": { schema: machineResponse, example: machineExample } },
            },
            400: {
                description: "Некорректный JSON или название станка",
                content: {
                    "application/json": {
                        schema: errorResponse,
                        example: { error: "Название станка должно быть непустой строкой." },
                    },
                },
            },
            500: internalErrorResponse,
        },
    });

    registry.registerPath({
        method: "patch",
        path: `${machinesPath}/{id}`,
        summary: "Изменить название или состояние станка",
        request: {
            params: z.object({ id: machineId }),
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: updateMachineBody,
                        examples: {
                            rename: { summary: "Переименовать", value: { name: "Станок ЧПУ №2" } },
                            disable: { summary: "Отключить", value: { isActive: false } },
                        },
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Станок обновлён",
                content: {
                    "application/json": { schema: machineResponse, example: { ...machineExample, isActive: false } },
                },
            },
            400: {
                description: "Некорректный ID или тело запроса",
                content: {
                    "application/json": {
                        schema: errorResponse,
                        example: { error: "Укажите непустое название станка или логическое значение isActive." },
                    },
                },
            },
            404: {
                description: "Станок не найден",
                content: { "application/json": { schema: errorResponse, example: { error: "Станок не найден." } } },
            },
            500: internalErrorResponse,
        },
    });
}

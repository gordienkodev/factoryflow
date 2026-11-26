import { STATUS_CODES } from "node:http";
import type { ErrorRequestHandler } from "express";

export const invalidJsonError = { error: "Invalid JSON" };
export const internalServerError = { error: "Внутренняя ошибка сервера" };

export const handleHttpError: ErrorRequestHandler = (error: unknown, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (typeof error === "object" && error !== null) {
        if ("type" in error && error.type === "entity.parse.failed") {
            res.status(400).json(invalidJsonError);
            return;
        }

        const status = "status" in error ? error.status : "statusCode" in error ? error.statusCode : undefined;
        if (typeof status === "number" && Number.isInteger(status) && status >= 400 && status < 500) {
            res.status(status).json({ error: STATUS_CODES[status] ?? "Ошибка запроса" });
            return;
        }
    }

    console.error(`Ошибка при обработке ${req.method} ${req.path}`, error);
    res.status(500).json(internalServerError);
};

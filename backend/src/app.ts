import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

export const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
}));

app.use(express.json());

const handleJsonParseError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.parse.failed") {
        res.status(400).json({ error: "Invalid JSON" });
        return;
    }

    next(error);
};

app.use(handleJsonParseError);

const registry = new OpenAPIRegistry();
const healthPath = "/api/health";
const healthResponse = z.object({ status: z.literal("ok") });

registry.registerPath({
    method: "get",
    path: healthPath,
    summary: "Проверка доступности API",
    responses: {
        200: {
            description: "API доступен",
            content: {
                "application/json": { schema: healthResponse },
            },
        },
    },
});

app.get(healthPath, (_req, res) => {
    const body: z.infer<typeof healthResponse> = { status: "ok" };
    res.json(body);
});

const openApi = new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "FactoryFlow API", version: "1.0.0" },
});

app.get("/api/openapi.json", (_req, res) => {
    res.json(openApi);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApi));
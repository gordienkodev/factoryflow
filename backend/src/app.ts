import express, { type ErrorRequestHandler } from "express";
import cors from "cors";

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

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

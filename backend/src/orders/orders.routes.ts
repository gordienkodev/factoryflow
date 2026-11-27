import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { completeOrderBody, createOrderBody, orderErrors, orderId } from "./orders.openapi.js";

export const ordersRouter = Router();

const orderRouteId = z.string().regex(/^\d+$/).transform(Number).pipe(orderId);
const orderResponseSelect = {
    id: true,
    number: true,
    name: true,
    status: true,
} satisfies Prisma.OrderSelect;

type OrderWithSchedule = Prisma.OrderGetPayload<{ select: typeof orderResponseSelect }> & {
    operationsCount: number;
    scheduledDurationMinutes: number;
};

ordersRouter.get("/", async (_req, res) => {
    const { prisma } = await import("../lib/prisma.js");
    const orders = await prisma.$queryRaw<OrderWithSchedule[]>`
        SELECT
            o."id",
            o."number",
            o."name",
            o."status"::text AS "status",
            COALESCE(schedule."operationsCount", 0)::double precision AS "operationsCount",
            COALESCE(schedule."scheduledDurationMinutes", 0)::double precision AS "scheduledDurationMinutes"
        FROM "Order" AS o
        LEFT JOIN (
            SELECT
                "orderId",
                COUNT(*) AS "operationsCount",
                EXTRACT(EPOCH FROM SUM("endTime" - "startTime")) / 60 AS "scheduledDurationMinutes"
            FROM "Operation"
            GROUP BY "orderId"
        ) AS schedule ON schedule."orderId" = o."id"
        ORDER BY o."id" DESC
    `;

    res.json(orders);
});

ordersRouter.post("/", async (req, res) => {
    const body = createOrderBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json(orderErrors.invalidCreate);
        return;
    }

    const { prisma } = await import("../lib/prisma.js");
    try {
        const order = await prisma.order.create({
            data: body.data,
            select: orderResponseSelect,
        });
        res.status(201).json(order);
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
            res.status(409).json(orderErrors.duplicateNumber);
            return;
        }

        throw error;
    }
});

ordersRouter.patch("/:id", async (req, res) => {
    const id = orderRouteId.safeParse(req.params.id);
    if (!id.success) {
        res.status(400).json(orderErrors.invalidId);
        return;
    }

    const body = completeOrderBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json(orderErrors.invalidStatus);
        return;
    }

    const { prisma } = await import("../lib/prisma.js");
    const [order] = await prisma.order.updateManyAndReturn({
        where: { id: id.data },
        data: body.data,
        select: orderResponseSelect,
    });
    if (!order) {
        res.status(404).json(orderErrors.notFound);
        return;
    }

    res.json(order);
});

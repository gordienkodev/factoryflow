import { Router } from "express";
import { downtimeSelect, lockMachines, overlappingInterval } from "../lib/scheduling.js";
import { createDowntimeBody } from "./downtimes.openapi.js";

export const downtimesRouter = Router();

downtimesRouter.post("/", async (req, res) => {
    const body = createDowntimeBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Некорректные данные простоя." });
        return;
    }

    const { machineId, reason, type } = body.data;
    const startTime = new Date(body.data.startTime);
    const endTime = new Date(body.data.endTime);
    if (!(startTime.getTime() < endTime.getTime())) {
        res.status(400).json({ error: "Начало должно быть раньше окончания." });
        return;
    }

    const { prisma } = await import("../lib/prisma.js");
    const result = await prisma.$transaction(async (tx) => {
        const [machine] = await lockMachines(tx, [machineId]);
        if (!machine) {
            return { status: 404, body: { error: "Станок не найден." } } as const;
        }

        const operation = await tx.operation.findFirst({
            where: { machineId, ...overlappingInterval(startTime, endTime) },
            select: { id: true },
        });
        if (operation) {
            return { status: 409, body: { code: "OPERATION_OVERLAP", message: "Станок занят операцией в это время." } } as const;
        }

        const downtime = await tx.downtime.create({
            data: { machineId, reason, type, startTime, endTime },
            select: downtimeSelect,
        });
        return { status: 201, body: downtime } as const;
    }, { isolationLevel: "ReadCommitted" });

    res.status(result.status).json(result.body);
});

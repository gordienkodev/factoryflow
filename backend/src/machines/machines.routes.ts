import { Router } from "express";
import { z } from "zod";
import { createMachineBody, machineId, updateMachineBody } from "./machines.openapi.js";

export const machinesRouter = Router();

const machineRouteId = z.string().regex(/^\d+$/).transform(Number).pipe(machineId);

machinesRouter.get("/", async (_req, res) => {
    const { prisma } = await import("../lib/prisma.js");
    const machines = await prisma.machine.findMany();
    res.json(machines);
});

machinesRouter.post("/", async (req, res) => {
    const body = createMachineBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Название станка должно быть непустой строкой." });
        return;
    }

    const { prisma } = await import("../lib/prisma.js");
    const machine = await prisma.machine.create({ data: body.data });
    res.status(201).json(machine);
});

machinesRouter.patch("/:id", async (req, res) => {
    const id = machineRouteId.safeParse(req.params.id);
    if (!id.success) {
        res.status(400).json({ error: "ID станка должен быть положительным целым числом в диапазоне Int." });
        return;
    }

    const body = updateMachineBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Укажите непустое название станка или логическое значение isActive." });
        return;
    }

    const { prisma } = await import("../lib/prisma.js");
    const [machine] = await prisma.machine.updateManyAndReturn({
        where: { id: id.data },
        data: body.data,
    });
    if (!machine) {
        res.status(404).json({ error: "Станок не найден." });
        return;
    }

    res.json(machine);
});

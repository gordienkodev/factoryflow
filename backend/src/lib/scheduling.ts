import { Prisma } from "../generated/prisma/client.js";

export const productionTimeZone = "Europe/Moscow";

export const operationSelect = {
    id: true,
    orderId: true,
    machineId: true,
    startTime: true,
    endTime: true,
    order: { select: { id: true, number: true, name: true, status: true } },
} satisfies Prisma.OperationSelect;

export const downtimeSelect = {
    id: true,
    machineId: true,
    reason: true,
    type: true,
    startTime: true,
    endTime: true,
} satisfies Prisma.DowntimeSelect;

export function overlappingInterval(startTime: Date, endTime: Date) {
    return { startTime: { lt: endTime }, endTime: { gt: startTime } };
}

export function lockMachines(tx: Prisma.TransactionClient, machineIds: number[]) {
    return tx.$queryRaw<{ id: number; isActive: boolean }[]>`
        SELECT "id", "isActive" FROM "Machine"
        WHERE "id" IN (${Prisma.join(machineIds)})
        ORDER BY "id" FOR UPDATE
    `;
}

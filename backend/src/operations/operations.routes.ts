import { Router, type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import type { Prisma } from '../generated/prisma/client.js';
import {
  lockMachines,
  operationSelect,
  overlappingInterval,
  productionTimeZone,
} from '../lib/scheduling.js';
import {
  createOperationBody,
  operationId,
  updateOperationBody,
} from './operations.openapi.js';

export const operationsRouter = Router();

const operationRouteId = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(operationId);
const transactionOptions = { isolationLevel: 'ReadCommitted' } as const;
const productionDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: productionTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const productionTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: productionTimeZone,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
});

class OperationRequestError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

function validateInterval(startTime: Date, endTime: Date) {
  if (!(startTime.getTime() < endTime.getTime())) {
    throw new OperationRequestError(
      400,
      'Начало должно быть раньше окончания.',
      'INVALID_TIME_INTERVAL',
    );
  }

  if (
    productionDate.format(startTime) !== productionDate.format(endTime) ||
    productionTime.format(startTime) < '08:00:00.000' ||
    productionTime.format(endTime) > '20:00:00.000'
  ) {
    throw new OperationRequestError(
      400,
      'Интервал должен укладываться в один рабочий день с 08:00 до 20:00 по Москве.',
      'OUTSIDE_WORKING_HOURS',
    );
  }
}

function parseOperationId(value: string) {
  const id = operationRouteId.safeParse(value);
  if (!id.success) {
    throw new OperationRequestError(
      400,
      'ID операции должен быть положительным целым числом в диапазоне Int.',
    );
  }
  return id.data;
}

async function lockOperation(tx: Prisma.TransactionClient, id: number) {
  const [operation] = await tx.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "Operation" WHERE "id" = ${id} FOR UPDATE
    `;
  if (!operation) {
    throw new OperationRequestError(404, 'Операция не найдена.');
  }
}

// For existing operations, lock the operation first, then the order, then machines by ID.
async function lockOrderAndMachines(
  tx: Prisma.TransactionClient,
  orderId: number,
  machineIds: number[],
) {
  const [order] = await tx.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
    `;
  if (!order) {
    throw new OperationRequestError(404, 'Заказ не найден.');
  }

  return lockMachines(tx, machineIds);
}

async function checkAvailability(
  tx: Prisma.TransactionClient,
  interval: {
    orderId: number;
    machineId: number;
    startTime: Date;
    endTime: Date;
  },
  previous?: { id: number; machineId: number },
) {
  const { orderId, machineId, startTime, endTime } = interval;
  const machineIds = previous ? [previous.machineId, machineId] : [machineId];
  const machines = await lockOrderAndMachines(tx, orderId, machineIds);
  const machine = machines.find(({ id }) => id === machineId);
  if (!machine) {
    throw new OperationRequestError(404, 'Станок не найден.');
  }
  if (!machine.isActive) {
    throw new OperationRequestError(
      409,
      'Станок неактивен.',
      'MACHINE_INACTIVE',
    );
  }

  const overlaps = overlappingInterval(startTime, endTime);
  const operationOverlaps = {
    ...overlaps,
    ...(previous && { id: { not: previous.id } }),
  };
  const select = { id: true };

  if (
    await tx.operation.findFirst({
      where: { ...operationOverlaps, machineId },
      select,
    })
  ) {
    throw new OperationRequestError(
      409,
      'Станок занят другой операцией.',
      'OPERATION_OVERLAP',
    );
  }
  if (
    await tx.downtime.findFirst({ where: { ...overlaps, machineId }, select })
  ) {
    throw new OperationRequestError(
      409,
      'В это время на станке запланирован простой.',
      'DOWNTIME_OVERLAP',
    );
  }
  if (
    await tx.operation.findFirst({
      where: { ...operationOverlaps, orderId },
      select,
    })
  ) {
    throw new OperationRequestError(
      409,
      'По этому заказу уже запланирована работа на это время.',
      'ORDER_OPERATION_OVERLAP',
    );
  }
}

operationsRouter.post('/', async (req, res) => {
  const body = createOperationBody.safeParse(req.body);
  if (!body.success) {
    throw new OperationRequestError(400, 'Некорректные данные операции.');
  }

  const data = {
    ...body.data,
    startTime: new Date(body.data.startTime),
    endTime: new Date(body.data.endTime),
  };
  validateInterval(data.startTime, data.endTime);

  const { prisma } = await import('../lib/prisma.js');
  const operation = await prisma.$transaction(async (tx) => {
    await checkAvailability(tx, data);
    return tx.operation.create({ data, select: operationSelect });
  }, transactionOptions);

  res.status(201).json(operation);
});

operationsRouter.patch('/:id', async (req, res) => {
  const id = parseOperationId(req.params.id);
  const body = updateOperationBody.safeParse(req.body);
  if (!body.success) {
    throw new OperationRequestError(400, 'Некорректные данные операции.');
  }

  const { prisma } = await import('../lib/prisma.js');
  const operation = await prisma.$transaction(async (tx) => {
    await lockOperation(tx, id);
    const current = await tx.operation.findUniqueOrThrow({
      where: { id },
      select: operationSelect,
    });
    const data = {
      machineId: body.data.machineId ?? current.machineId,
      startTime:
        body.data.startTime === undefined
          ? current.startTime
          : new Date(body.data.startTime),
      endTime:
        body.data.endTime === undefined
          ? current.endTime
          : new Date(body.data.endTime),
    };
    validateInterval(data.startTime, data.endTime);
    await checkAvailability(tx, { ...data, orderId: current.orderId }, current);

    return tx.operation.update({
      where: { id },
      data,
      select: operationSelect,
    });
  }, transactionOptions);

  res.json(operation);
});

operationsRouter.delete('/:id', async (req, res) => {
  const id = parseOperationId(req.params.id);
  const { prisma } = await import('../lib/prisma.js');
  await prisma.$transaction(async (tx) => {
    await lockOperation(tx, id);
    const { orderId, machineId } = await tx.operation.findUniqueOrThrow({
      where: { id },
      select: { orderId: true, machineId: true },
    });
    await lockOrderAndMachines(tx, orderId, [machineId]);
    await tx.operation.delete({ where: { id } });
  }, transactionOptions);

  res.status(204).end();
});

const handleOperationError: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (!(error instanceof OperationRequestError)) {
    next(error);
    return;
  }

  const body = error.code
    ? { code: error.code, message: error.message }
    : { error: error.message };
  res.status(error.status).json(body);
};

operationsRouter.use(handleOperationError);

import { Router } from 'express';
import {
  downtimeSelect,
  operationSelect,
  overlappingInterval,
  productionTimeZone,
} from '../lib/scheduling.js';
import { scheduleQuery } from './schedule.openapi.js';

export const scheduleRouter = Router();

const dayInMilliseconds = 86_400_000;
const productionCalendar = new Intl.DateTimeFormat('en-US', {
  timeZone: productionTimeZone,
  calendar: 'iso8601',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  era: 'short',
});

function productionDateNumber(timestamp: number) {
  const parts = productionCalendar.formatToParts(timestamp);
  const year = Number(parts.find(({ type }) => type === 'year')?.value);
  const month = Number(parts.find(({ type }) => type === 'month')?.value);
  const day = Number(parts.find(({ type }) => type === 'day')?.value);
  const era = parts.find(({ type }) => type === 'era')?.value;
  return (era === 'BC' ? 1 - year : year) * 10_000 + month * 100 + day;
}

function startOfProductionDay(utcMidnight: number) {
  const date = new Date(utcMidnight);
  const target =
    date.getUTCFullYear() * 10_000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate();
  let earlier = utcMidnight - dayInMilliseconds;
  let later = utcMidnight + dayInMilliseconds;

  // Find the first instant of this local date even if the UTC offset changes overnight.
  while (later - earlier > 1) {
    const midpoint = earlier + Math.floor((later - earlier) / 2);
    if (productionDateNumber(midpoint) < target) {
      earlier = midpoint;
    } else {
      later = midpoint;
    }
  }
  return new Date(later);
}

scheduleRouter.get('/', async (req, res) => {
  const query = scheduleQuery.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: 'Укажите дату в формате YYYY-MM-DD.' });
    return;
  }

  const { date } = query.data;
  const utcMidnight = Date.parse(`${date}T00:00:00Z`);
  const dayStart = startOfProductionDay(utcMidnight);
  const dayEnd = startOfProductionDay(utcMidnight + dayInMilliseconds);
  const overlaps = overlappingInterval(dayStart, dayEnd);

  const { prisma } = await import('../lib/prisma.js');
  const [machines, operations, downtimes] = await prisma.$transaction(
    [
      prisma.machine.findMany({
        where: {
          OR: [
            { isActive: true },
            { operations: { some: overlaps } },
            { downtimes: { some: overlaps } },
          ],
        },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
      prisma.operation.findMany({
        where: overlaps,
        select: operationSelect,
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      }),
      prisma.downtime.findMany({
        where: overlaps,
        select: downtimeSelect,
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );

  res.json({ date, machines, operations, downtimes });
});

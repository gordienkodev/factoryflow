const productionClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Moscow',
  calendar: 'iso8601',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function productionDateTime(instant: Date): string {
  const parts = Object.fromEntries(
    productionClock
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function todayInMoscow(): string {
  return productionDateTime(new Date()).slice(0, 10);
}

function moscowTimeToUtc(date: string, time: string): number {
  const localTime = `${date}T${time}:00`;
  const target = Date.parse(`${localTime}Z`);
  if (!Number.isFinite(target)) {
    throw new Error('Укажите корректные дату и время.');
  }

  let instant = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const actual = productionDateTime(new Date(instant));
    if (actual === localTime) {
      return instant;
    }
    instant += target - Date.parse(`${actual}Z`);
  }
  throw new Error('Указанное время недоступно в часовом поясе Москвы.');
}

export function moscowInterval(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): { startTime: string; endTime: string } {
  const start = moscowTimeToUtc(startDate, startTime);
  const end = moscowTimeToUtc(endDate, endTime);
  if (start >= end) {
    throw new Error('Начало должно быть раньше окончания.');
  }
  return {
    startTime: new Date(start).toISOString(),
    endTime: new Date(end).toISOString(),
  };
}

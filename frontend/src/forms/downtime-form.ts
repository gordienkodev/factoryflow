import { createDowntime, getMachines } from '../api';
import type { Downtime } from '../types';
import { moscowInterval } from '../utils/production-time';
import {
  fieldRow,
  openScheduleDialog,
  requiredInput,
  requiredSelect,
  withLabel,
  type ScheduleFormOptions,
} from './schedule-dialog';

const downtimeTypes: Record<Downtime['type'], string> = {
  MAINTENANCE: 'Техобслуживание',
  BREAKDOWN: 'Поломка',
  OTHER: 'Другое',
};

export function openDowntimeForm(
  container: HTMLElement,
  options: ScheduleFormOptions,
): void {
  const machine = requiredSelect('Выберите станок');
  const type = requiredSelect('Выберите тип простоя');
  for (const [value, label] of Object.entries(downtimeTypes)) {
    type.add(new Option(label, value));
  }
  const reason = document.createElement('textarea');
  reason.rows = 2;
  reason.required = true;
  const startDate = requiredInput('date', options.date);
  const startTime = requiredInput('time');
  const endDate = requiredInput('date', options.date);
  const endTime = requiredInput('time');

  const timeZone = document.createElement('p');
  timeZone.className = 'schedule-dialog__hint';
  timeZone.textContent = 'Время по Москве';

  openScheduleDialog(container, {
    title: 'Новый простой',
    fields: [
      withLabel('Станок', machine),
      withLabel('Тип', type),
      withLabel('Причина', reason),
      fieldRow(
        withLabel('Дата начала', startDate),
        withLabel('Время начала', startTime),
      ),
      fieldRow(
        withLabel('Дата окончания', endDate),
        withLabel('Время окончания', endTime),
      ),
      timeZone,
    ],
    async load() {
      const machines = await getMachines();
      if (machines.length === 0) {
        throw new Error('Нет станков для добавления простоя.');
      }
      for (const { id, name, isActive } of machines) {
        machine.add(
          new Option(isActive ? name : `${name} (неактивен)`, String(id)),
        );
      }
    },
    async save() {
      const description = reason.value.trim();
      if (!description) {
        throw new Error('Укажите причину простоя.');
      }
      await createDowntime({
        machineId: Number(machine.value),
        type: type.value as Downtime['type'],
        reason: description,
        ...moscowInterval(
          startDate.value,
          startTime.value,
          endDate.value,
          endTime.value,
        ),
      });
    },
    onSaved: options.onSaved,
  });
}

import { createOperation, getMachines, getOrders } from '../api';
import { moscowInterval } from '../utils/production-time';
import {
  fieldRow,
  openScheduleDialog,
  requiredInput,
  requiredSelect,
  withLabel,
  type ScheduleFormOptions,
} from './schedule-dialog';

export function openOperationForm(
  container: HTMLElement,
  options: ScheduleFormOptions,
): void {
  const order = requiredSelect('Выберите заказ');
  const machine = requiredSelect('Выберите станок');
  const date = requiredInput('date', options.date);
  const startTime = requiredInput('time');
  const endTime = requiredInput('time');
  for (const input of [startTime, endTime]) {
    input.min = '08:00';
    input.max = '20:00';
  }

  const workingHours = document.createElement('p');
  workingHours.className = 'schedule-dialog__hint';
  workingHours.textContent = 'Рабочее время 08:00–20:00 МСК';

  openScheduleDialog(container, {
    title: 'Новая операция',
    fields: [
      withLabel('Заказ', order),
      withLabel('Станок', machine),
      withLabel('Дата', date),
      fieldRow(withLabel('Начало', startTime), withLabel('Окончание', endTime)),
      workingHours,
    ],
    async load() {
      const [orders, machines] = await Promise.all([
        getOrders(),
        getMachines(),
      ]);
      const activeMachines = machines.filter(({ isActive }) => isActive);
      if (orders.length === 0) {
        throw new Error('Нет заказов для планирования.');
      }
      if (activeMachines.length === 0) {
        throw new Error('Для операции нужен активный станок.');
      }
      for (const { id, number, name } of orders) {
        order.add(new Option(`${number} · ${name}`, String(id)));
      }
      for (const { id, name } of activeMachines) {
        machine.add(new Option(name, String(id)));
      }
    },
    async save() {
      await createOperation({
        orderId: Number(order.value),
        machineId: Number(machine.value),
        ...moscowInterval(
          date.value,
          startTime.value,
          date.value,
          endTime.value,
        ),
      });
    },
    onSaved: options.onSaved,
  });
}

import { openDowntimeForm } from '../forms/downtime-form';
import { openOperationForm } from '../forms/operation-form';
import { todayInMoscow } from '../utils/production-time';
import './schedule.css';

export function renderSchedulePage(container: HTMLElement): void {
  const title = document.createElement('h1');
  title.tabIndex = -1;
  title.textContent = 'Расписание';

  const actions = document.createElement('div');
  actions.className = 'schedule-actions';

  const operation = document.createElement('button');
  operation.type = 'button';
  operation.className = 'schedule-button schedule-button--primary';
  operation.textContent = '+ Операция';
  const downtime = document.createElement('button');
  downtime.type = 'button';
  downtime.className = 'schedule-button';
  downtime.textContent = '+ Простой';
  actions.append(operation, downtime);

  const status = document.createElement('p');
  status.className = 'schedule-status';
  status.setAttribute('role', 'status');
  container.append(title, actions, status);

  operation.addEventListener('click', () => {
    status.textContent = '';
    openOperationForm(container, {
      date: todayInMoscow(),
      onSaved: () => {
        status.textContent = 'Операция добавлена.';
      },
    });
  });

  downtime.addEventListener('click', () => {
    status.textContent = '';
    openDowntimeForm(container, {
      date: todayInMoscow(),
      onSaved: () => {
        status.textContent = 'Простой добавлен.';
      },
    });
  });
}

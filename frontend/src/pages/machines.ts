import { createMachine, getMachines } from '../api';
import type { Machine } from '../types';

function createMachineCard(machine: Machine): HTMLElement {
  const card = document.createElement('article');
  card.className = 'machine-card';

  const name = document.createElement('h2');
  name.className = 'machine-card__name';
  name.textContent = machine.name;

  const badge = document.createElement('span');
  badge.className = 'machine-card__status';
  if (machine.isActive) {
    badge.classList.add('machine-card__status--active');
  }
  badge.textContent = machine.isActive ? 'Активен' : 'Неактивен';

  card.append(name, badge);
  return card;
}

export function renderMachinesPage(container: HTMLElement): void {
  const heading = document.createElement('h1');
  heading.textContent = 'Станки';
  heading.tabIndex = -1;

  const form = document.createElement('form');
  form.className = 'machine-form';

  const label = document.createElement('label');
  label.className = 'machine-form__label';
  label.htmlFor = 'machine-name';
  label.textContent = 'Название станка';

  const controls = document.createElement('div');
  controls.className = 'machine-form__controls';

  const input = document.createElement('input');
  input.className = 'machine-form__input';
  input.id = 'machine-name';
  input.name = 'name';
  input.type = 'text';
  input.required = true;

  const submit = document.createElement('button');
  submit.className = 'machine-form__submit';
  submit.type = 'submit';
  submit.textContent = 'Добавить станок';

  const formStatus = document.createElement('p');
  formStatus.className = 'machine-form__status';
  formStatus.setAttribute('role', 'status');
  controls.append(input, submit);
  form.append(label, controls, formStatus);

  const status = document.createElement('p');
  status.className = 'machines-status';
  status.setAttribute('role', 'status');

  const grid = document.createElement('div');
  grid.className = 'machines-grid';
  grid.hidden = true;
  container.append(heading, form, status, grid);

  let loadVersion = 0;

  async function loadMachines(
    errorMessage = 'Не удалось загрузить список станков.',
  ): Promise<void> {
    const version = ++loadVersion;
    status.textContent = 'Загрузка станков…';
    try {
      const machines = await getMachines();
      if (version !== loadVersion) {
        return;
      }

      grid.replaceChildren(...machines.map(createMachineCard));
      grid.hidden = machines.length === 0;
      status.textContent = grid.hidden ? 'Станков пока нет.' : '';
    } catch (error) {
      if (version === loadVersion) {
        status.textContent =
          error instanceof Error
            ? `${errorMessage} ${error.message}`
            : errorMessage;
      }
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) {
      return;
    }

    const name = input.value.trim();
    if (!name) {
      formStatus.textContent = 'Введите название станка.';
      input.focus();
      return;
    }

    submit.disabled = true;
    input.readOnly = true;
    formStatus.textContent = 'Сохраняем станок…';
    try {
      await createMachine({ name });
      form.reset();
      formStatus.textContent = 'Станок добавлен.';
      await loadMachines('Не удалось обновить список станков.');
    } catch (error) {
      const message = 'Не удалось добавить станок.';
      formStatus.textContent =
        error instanceof Error ? `${message} ${error.message}` : message;
    } finally {
      input.readOnly = false;
      submit.disabled = false;
    }
  });

  void loadMachines();
}

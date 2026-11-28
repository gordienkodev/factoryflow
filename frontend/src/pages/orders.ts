import { createOrder, getOrders } from '../api';
import type { Order } from '../types';
import { clearFieldError, showFieldError } from '../utils/form';

const statusLabels: Record<Order['status'], string> = {
  pending: 'Ожидает выполнения',
  completed: 'Выполнен',
};
const duplicateNumberMessage = 'Заказ с таким номером уже существует';

function createOrderCard(order: Order): HTMLElement {
  const card = document.createElement('article');
  card.className = 'order-card';

  const number = document.createElement('h2');
  number.className = 'order-card__name';
  number.textContent = order.number;

  const name = document.createElement('p');
  name.className = 'order-card__product';
  name.textContent = order.name;

  const status = document.createElement('span');
  status.className = `order-card__status order-card__status--${order.status}`;
  status.textContent = statusLabels[order.status];

  card.append(number, name, status);
  return card;
}

function createOrderField(name: string, labelText: string) {
  const field = document.createElement('div');
  const id = `order-${name}`;

  const label = document.createElement('label');
  label.className = 'order-form__label';
  label.htmlFor = id;
  label.textContent = labelText;

  const error = document.createElement('p');
  error.id = `${id}-error`;
  error.className = 'order-form__error';
  error.setAttribute('role', 'alert');

  const input = document.createElement('input');
  input.className = 'order-form__input';
  input.id = id;
  input.name = name;
  input.type = 'text';
  input.required = true;
  input.setAttribute('aria-describedby', error.id);

  field.append(label, input, error);
  return { field, input, error };
}

export function renderOrdersPage(container: HTMLElement): void {
  const heading = document.createElement('h1');
  heading.textContent = 'Заказы';
  heading.tabIndex = -1;

  const form = document.createElement('form');
  form.className = 'order-form';

  const {
    field: numberField,
    input: numberInput,
    error: numberError,
  } = createOrderField('number', 'Номер заказа');
  const {
    field: nameField,
    input: nameInput,
    error: nameError,
  } = createOrderField('name', 'Название изделия');
  nameInput.maxLength = 255;

  const submit = document.createElement('button');
  submit.className = 'order-form__submit';
  submit.type = 'submit';
  submit.textContent = 'Добавить заказ';

  const saveStatus = document.createElement('p');
  saveStatus.className = 'order-form__status';
  saveStatus.setAttribute('role', 'status');

  const controls = document.createElement('div');
  controls.append(submit, saveStatus);
  form.append(numberField, nameField, controls);

  const listStatus = document.createElement('p');
  listStatus.className = 'orders-status';
  listStatus.setAttribute('role', 'status');

  const retry = document.createElement('button');
  retry.className = 'order-form__button orders__retry';
  retry.type = 'button';
  retry.textContent = 'Повторить';
  retry.hidden = true;

  const grid = document.createElement('div');
  grid.className = 'orders-grid';
  grid.hidden = true;
  container.append(heading, form, listStatus, retry, grid);

  let loadVersion = 0;
  let orders: Order[] = [];

  function renderOrderList(): void {
    grid.replaceChildren(...orders.map(createOrderCard));
    grid.hidden = orders.length === 0;
  }

  async function loadOrders(errorMessage = 'Не удалось загрузить заказы.') {
    const version = ++loadVersion;
    listStatus.textContent = 'Загрузка заказов…';
    retry.hidden = true;

    try {
      const loadedOrders = await getOrders();
      if (version !== loadVersion) return;

      orders = loadedOrders;
      renderOrderList();
      listStatus.textContent = grid.hidden ? 'Заказов пока нет.' : '';
    } catch {
      if (version !== loadVersion) return;

      listStatus.textContent = errorMessage;
      retry.hidden = false;
    }
  }

  retry.addEventListener('click', () => void loadOrders());
  numberInput.addEventListener('input', () =>
    clearFieldError(numberInput, numberError),
  );
  nameInput.addEventListener('input', () =>
    clearFieldError(nameInput, nameError),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const number = numberInput.value.trim();
    const name = nameInput.value.trim();
    saveStatus.textContent = '';
    saveStatus.classList.remove('order-form__status--error');

    if (!number || [...number].length > 10) {
      const message = number
        ? 'Введите не более 10 символов.'
        : 'Введите номер заказа.';
      showFieldError(numberInput, numberError, message);
      return;
    }
    if (!name) {
      showFieldError(nameInput, nameError, 'Введите название изделия.');
      return;
    }

    submit.disabled = true;
    numberInput.readOnly = true;
    nameInput.readOnly = true;
    saveStatus.textContent = 'Сохраняем заказ…';

    try {
      const order = await createOrder({ number, name });
      orders = [order, ...orders.filter(({ id }) => id !== order.id)];
      renderOrderList();
      form.reset();
      saveStatus.textContent = 'Заказ добавлен.';
      void loadOrders('Не удалось обновить список заказов.');
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === `${duplicateNumberMessage}.` ||
          error.message.startsWith('HTTP 409:'))
      ) {
        saveStatus.textContent = '';
        showFieldError(numberInput, numberError, duplicateNumberMessage);
      } else {
        const message = 'Не удалось сохранить заказ.';
        saveStatus.classList.add('order-form__status--error');
        saveStatus.textContent =
          error instanceof Error ? `${message} ${error.message}` : message;
      }
    } finally {
      numberInput.readOnly = false;
      nameInput.readOnly = false;
      submit.disabled = false;
    }
  });

  void loadOrders();
}

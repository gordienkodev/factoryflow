type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type ScheduleFormOptions = {
  date: string;
  onSaved: () => void;
};

export function requiredInput(type: string, value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.required = true;
  return input;
}

export function requiredSelect(placeholder: string): HTMLSelectElement {
  const select = document.createElement('select');
  const emptyOption = new Option(placeholder, '', true, true);
  emptyOption.disabled = true;
  select.add(emptyOption);
  select.required = true;
  return select;
}

export function withLabel(text: string, field: FormField): HTMLLabelElement {
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = text;
  label.append(caption, field);
  return label;
}

export function fieldRow(...fields: HTMLElement[]): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'schedule-dialog__row';
  row.append(...fields);
  return row;
}

export function openScheduleDialog(
  container: HTMLElement,
  options: {
    title: string;
    fields: HTMLElement[];
    load: () => Promise<void>;
    save: () => Promise<unknown>;
    onSaved: () => void;
  },
): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'schedule-dialog';
  dialog.setAttribute('aria-labelledby', 'schedule-dialog-title');

  const form = document.createElement('form');
  const title = document.createElement('h2');
  title.id = 'schedule-dialog-title';
  title.textContent = options.title;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'schedule-dialog__close';
  close.setAttribute('aria-label', 'Закрыть');
  close.textContent = '×';

  const fields = document.createElement('fieldset');
  fields.disabled = true;
  fields.append(...options.fields);

  const status = document.createElement('p');
  status.className = 'schedule-dialog__status';
  status.setAttribute('role', 'status');
  status.textContent = 'Загрузка…';

  const errorMessage = document.createElement('p');
  errorMessage.className = 'schedule-dialog__error';
  errorMessage.setAttribute('role', 'alert');

  const actions = document.createElement('div');
  actions.className = 'schedule-dialog__actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'schedule-button';
  cancel.textContent = 'Отмена';
  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'schedule-button schedule-button--primary';
  save.textContent = 'Сохранить';
  save.disabled = true;
  actions.append(cancel, save);

  form.append(title, close, fields, status, errorMessage, actions);
  dialog.append(form);
  container.append(dialog);
  dialog.showModal();

  close.addEventListener('click', () => dialog.close());
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove());

  let saving = false;
  dialog.addEventListener('cancel', (event) => {
    if (saving) {
      event.preventDefault();
    }
  });

  function showError(error: unknown, fallback: string): void {
    errorMessage.textContent =
      error instanceof Error ? error.message : fallback;
  }

  async function load(): Promise<void> {
    try {
      await options.load();
      fields.disabled = false;
      save.disabled = false;
    } catch (error) {
      showError(error, 'Не удалось загрузить данные формы.');
    } finally {
      status.textContent = '';
    }
  }
  void load();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (save.disabled) {
      return;
    }

    saving = true;
    fields.disabled = true;
    close.disabled = true;
    cancel.disabled = true;
    save.disabled = true;
    status.textContent = 'Сохранение…';
    errorMessage.textContent = '';

    try {
      await options.save();
    } catch (error) {
      showError(error, 'Не удалось сохранить запись.');
      return;
    } finally {
      saving = false;
      fields.disabled = false;
      close.disabled = false;
      cancel.disabled = false;
      save.disabled = false;
      status.textContent = '';
    }

    if (dialog.open && dialog.isConnected) {
      dialog.close();
      options.onSaved();
    }
  });
}

export function showFieldError(
  input: HTMLInputElement,
  errorElement: HTMLElement,
  message: string,
): void {
  input.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  input.focus();
}

export function clearFieldError(
  input: HTMLInputElement,
  errorElement: HTMLElement,
): void {
  input.removeAttribute('aria-invalid');
  errorElement.textContent = '';
}

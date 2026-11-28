export function formatErrorMessage(message: string, error: unknown): string {
  return error instanceof Error ? `${message} ${error.message}` : message;
}

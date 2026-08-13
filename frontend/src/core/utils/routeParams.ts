export function isPositiveIntegerId(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function parsePositiveIntegerId(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return isPositiveIntegerId(parsed) ? parsed : null;
}

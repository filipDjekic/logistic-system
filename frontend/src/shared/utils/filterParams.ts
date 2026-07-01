export function optionalTrimmedString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function optionalFiniteNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function hasTrimmedValue(value: string | null | undefined): boolean {
  return Boolean(optionalTrimmedString(value));
}

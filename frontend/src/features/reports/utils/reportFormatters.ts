export function toDateTimeStartParam(value: string) {
  return value ? `${value}T00:00:00` : undefined;
}

export function toDateTimeEndParam(value: string) {
  return value ? `${value}T23:59:59` : undefined;
}

export function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

export function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

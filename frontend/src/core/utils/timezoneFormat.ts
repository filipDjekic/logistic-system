export type TemporalView = {
  localDateTime?: string | null;
  utcInstant?: string | null;
  offsetDateTime?: string | null;
  zoneId?: string | null;
  zoneDisplayName?: string | null;
};

export function formatTemporalView(view: TemporalView | null | undefined, fallback?: string | null): string {
  const value = view?.offsetDateTime ?? view?.utcInstant ?? view?.localDateTime ?? fallback;
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ');

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: view?.zoneId ?? undefined,
  }).format(date);
}

export function formatTemporalZone(view: TemporalView | null | undefined, fallbackZone?: string | null): string {
  return view?.zoneDisplayName ?? view?.zoneId ?? fallbackZone ?? '—';
}

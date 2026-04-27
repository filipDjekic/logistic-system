export const cacheTimes = {
  volatile: 15_000,
  standard: 60_000,
  reference: 5 * 60_000,
  session: 10 * 60_000,
} as const;

export const garbageCollectionTimes = {
  standard: 10 * 60_000,
  reference: 30 * 60_000,
} as const;

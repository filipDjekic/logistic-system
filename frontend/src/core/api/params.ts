type ParamValue = string | number | boolean | null | undefined;

export type ApiParams = Record<string, ParamValue>;

export function trimSearch(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function enumFilter<T extends string>(value: T | 'ALL' | null | undefined) {
  return value == null || value === 'ALL' ? undefined : value;
}

export function compactParams(params: ApiParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

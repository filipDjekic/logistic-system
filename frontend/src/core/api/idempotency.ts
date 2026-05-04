import type { InternalAxiosRequestConfig } from 'axios';

const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';
const TTL_MS = 3_000;
const mutatingMethods = new Set(['post', 'put', 'patch', 'delete']);
const keyCache = new Map<string, { key: string; expiresAt: number }>();

export function applyIdempotencyKey(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const method = config.method?.toLowerCase();

  if (!method || !mutatingMethods.has(method)) {
    return config;
  }

  const signature = buildRequestSignature(config);
  const now = Date.now();
  cleanup(now);

  const cached = keyCache.get(signature);
  const key = cached && cached.expiresAt > now ? cached.key : createIdempotencyKey();

  keyCache.set(signature, { key, expiresAt: now + TTL_MS });
  config.headers.set(IDEMPOTENCY_HEADER, key);

  return config;
}

function buildRequestSignature(config: InternalAxiosRequestConfig): string {
  return [
    config.method?.toUpperCase() ?? 'GET',
    config.baseURL ?? '',
    config.url ?? '',
    stableSerialize(config.params),
    stableSerialize(config.data),
  ].join('|');
}

function stableSerialize(value: unknown): string {
  if (value === undefined || value === null || typeof value !== 'object') {
    return String(value ?? '');
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof FormData) {
    return 'form-data';
  }

  try {
    return JSON.stringify(sortObject(value));
  } catch {
    return String(value);
  }
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObject((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}

function createIdempotencyKey(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cleanup(now: number): void {
  keyCache.forEach((value, key) => {
    if (value.expiresAt <= now) {
      keyCache.delete(key);
    }
  });
}

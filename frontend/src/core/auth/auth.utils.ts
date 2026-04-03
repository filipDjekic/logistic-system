import { getAccessToken, removeAccessToken, setAccessToken } from './token';

export function readStoredAccessToken(): string | null {
  return getAccessToken();
}

export function persistAccessToken(token: string): void {
  setAccessToken(token);
}

export function clearPersistedAuth(): void {
  removeAccessToken();
}

export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
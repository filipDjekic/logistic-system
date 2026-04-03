import { STORAGE_KEYS } from '../constants/storageKeys';

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}
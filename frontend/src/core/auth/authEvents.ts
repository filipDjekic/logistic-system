export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export function emitSessionExpired(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

export function subscribeSessionExpired(listener: () => void): () => void {
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
}

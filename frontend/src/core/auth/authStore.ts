import { useSyncExternalStore } from 'react';
import type { AuthState, AuthUser } from './auth.types';
import { clearPersistedAuth, persistAccessToken, readStoredAccessToken } from './auth.utils';

const initialAccessToken = readStoredAccessToken();

let authState: AuthState = {
  status: initialAccessToken ? 'idle' : 'unauthenticated',
  accessToken: initialAccessToken,
  user: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: AuthState) {
  authState = nextState;
  emitChange();
}

export const authStore = {
  getState(): AuthState {
    return authState;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  setLoading() {
    setState({
      ...authState,
      status: 'loading',
    });
  },

  setAuthenticated(payload: { accessToken: string; user: AuthUser }) {
    persistAccessToken(payload.accessToken);

    setState({
      status: 'authenticated',
      accessToken: payload.accessToken,
      user: payload.user,
    });
  },

  setUnauthenticated() {
    clearPersistedAuth();

    setState({
      status: 'unauthenticated',
      accessToken: null,
      user: null,
    });
  },

  hydrateFromStorage() {
    const accessToken = readStoredAccessToken();

    setState({
      ...authState,
      accessToken,
      status: accessToken ? 'idle' : 'unauthenticated',
    });
  },
};

export function useAuthStore(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
}
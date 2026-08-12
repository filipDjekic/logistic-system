import { createElement, StrictMode, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authStore } from '../../../core/auth/authStore';
import { act, createAuthUser, renderHook, TestProviders, waitFor } from '../../../test/test-utils';
import { buildNotificationStreamUrl, useNotificationLiveUpdates } from './useNotificationLiveUpdates';

function authenticated(token: string) {
  authStore.setAuthenticated({ accessToken: token, user: createAuthUser() });
}

function pendingStreamFetch() {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
}

afterEach(() => {
  act(() => authStore.setUnauthenticated());
  vi.unstubAllGlobals();
});

describe('notification stream authentication', () => {
  it('never places the bearer token in the stream URL', () => {
    const url = new URL(buildNotificationStreamUrl());

    expect(url.pathname).toBe('/api/notifications/my/stream');
    expect(url.searchParams.has('access_token')).toBe(false);
  });

  it('keeps only one live request after the StrictMode setup-cleanup cycle', async () => {
    authenticated('strict-mode-token');
    const fetchMock = pendingStreamFetch();
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, createElement(TestProviders, null, children));
    const { unmount } = renderHook(() => useNotificationLiveUpdates(), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const signals = fetchMock.mock.calls.map((call) => call[1]?.signal);
    expect(signals.filter((signal) => signal && !signal.aborted)).toHaveLength(1);

    unmount();
    expect(signals.every((signal) => signal?.aborted)).toBe(true);
  });

  it('aborts and replaces the stream when the token changes, then aborts on logout', async () => {
    authenticated('first-token');
    const fetchMock = pendingStreamFetch();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useNotificationLiveUpdates(), { wrapper: TestProviders });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const firstSignal = fetchMock.mock.calls[0][1]?.signal;

    act(() => authenticated('second-token'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual(expect.objectContaining({
      Authorization: 'Bearer second-token',
    }));
    const secondSignal = fetchMock.mock.calls[1][1]?.signal;

    act(() => authStore.setUnauthenticated());
    await waitFor(() => expect(secondSignal?.aborted).toBe(true));
  });
});

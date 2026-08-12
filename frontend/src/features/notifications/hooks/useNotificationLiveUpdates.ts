import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { appEnv } from '../../../core/config/env';
import { queryKeys } from '../../../core/constants/queryKeys';
import {
  NOTIFICATION_SSE_MAX_RECONNECT_MS,
  NOTIFICATION_SSE_RECONNECT_MS,
  NOTIFICATION_SSE_SEEN_EVENT_LIMIT,
  NOTIFICATION_SSE_VISIBLE_REFRESH_DEBOUNCE_MS,
} from '../constants/notificationLive';
import type { NotificationStreamEventResponse } from '../types/notification.types';

export function buildNotificationStreamUrl(): string {
  const baseUrl = appEnv.apiBaseUrl.replace(/\/$/, '');
  return new URL(`${baseUrl}/api/notifications/my/stream`).toString();
}

export function useNotificationLiveUpdates() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const lastToastedNotificationIdRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const seenEventIdsRef = useRef<string[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = auth.accessToken;

    if (auth.status !== 'authenticated' || !token || typeof window === 'undefined' || typeof window.fetch === 'undefined') {
      return undefined;
    }

    let isStopped = false;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const clearRefreshTimeout = () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };

    const invalidateNotificationData = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.employeeProfileChangeRequests.root() });
    };

    const scheduleInvalidateNotificationData = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      clearRefreshTimeout();
      refreshTimeoutRef.current = window.setTimeout(
        invalidateNotificationData,
        NOTIFICATION_SSE_VISIBLE_REFRESH_DEBOUNCE_MS,
      );
    };

    const rememberEventId = (eventId: string | null): boolean => {
      if (!eventId) {
        return true;
      }

      if (seenEventIdsRef.current.includes(eventId)) {
        return false;
      }

      seenEventIdsRef.current = [...seenEventIdsRef.current, eventId].slice(-NOTIFICATION_SSE_SEEN_EVENT_LIMIT);
      return true;
    };

    const handleStreamEvent = (data: string, eventId: string | null) => {
      if (!rememberEventId(eventId)) {
        return;
      }

      const payload = JSON.parse(data) as NotificationStreamEventResponse;

      if (payload.eventType === 'CONNECTED') {
        scheduleInvalidateNotificationData();
        return;
      }

      if (payload.eventType === 'HEARTBEAT') {
        return;
      }

      scheduleInvalidateNotificationData();

      if (payload.eventType !== 'CREATED' || !payload.notification) {
        return;
      }

      if (payload.notification.id === lastToastedNotificationIdRef.current) {
        return;
      }

      lastToastedNotificationIdRef.current = payload.notification.id;

      if (document.visibilityState !== 'visible') {
        return;
      }

      showSnackbar({
        message: payload.notification.title || 'New notification',
        severity:
          payload.notification.severity === 'CRITICAL' || payload.notification.type === 'ERROR'
            ? 'error'
            : payload.notification.severity === 'WARNING' || payload.notification.type === 'WARNING'
              ? 'warning'
              : 'info',
      });
    };

    const scheduleReconnect = () => {
      if (isStopped) {
        return;
      }
      reconnectAttemptRef.current += 1;
      const delay = Math.min(
        NOTIFICATION_SSE_RECONNECT_MS * 2 ** Math.min(reconnectAttemptRef.current - 1, 5),
        NOTIFICATION_SSE_MAX_RECONNECT_MS,
      );
      reconnectTimeoutRef.current = window.setTimeout(() => {
        void connect();
      }, delay);
    };

    const connect = async () => {
      clearReconnectTimeout();
      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;

      try {
        const response = await fetch(buildNotificationStreamUrl(), {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          return;
        }
        if (!response.ok || !response.body) {
          throw new Error(`Notification stream failed with status ${response.status}`);
        }
        reconnectAttemptRef.current = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isStopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            let eventId: string | null = null;
            const dataLines: string[] = [];
            for (const line of block.split('\n')) {
              if (line.startsWith('id:')) eventId = line.slice(3).trim();
              if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
            }
            if (dataLines.length > 0) {
              try {
                handleStreamEvent(dataLines.join('\n'), eventId);
              } catch {
                scheduleInvalidateNotificationData();
              }
            }
            boundary = buffer.indexOf('\n\n');
          }
        }
        if (!isStopped) scheduleReconnect();
      } catch (error) {
        if (!isStopped && !(error instanceof DOMException && error.name === 'AbortError')) {
          scheduleReconnect();
        }
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        invalidateNotificationData();

        if (!streamAbortRef.current && !isStopped) {
          void connect();
        }
      } else {
        clearRefreshTimeout();
      }
    };

    void connect();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isStopped = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearReconnectTimeout();
      clearRefreshTimeout();
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
    };
  }, [auth.accessToken, auth.status, queryClient, showSnackbar]);
}

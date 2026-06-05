import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getAccessToken } from '../../../core/auth/token';
import { appEnv } from '../../../core/config/env';
import { queryKeys } from '../../../core/constants/queryKeys';
import {
  NOTIFICATION_SSE_MAX_RECONNECT_MS,
  NOTIFICATION_SSE_RECONNECT_MS,
  NOTIFICATION_SSE_SEEN_EVENT_LIMIT,
  NOTIFICATION_SSE_VISIBLE_REFRESH_DEBOUNCE_MS,
} from '../constants/notificationLive';
import type { NotificationStreamEventResponse } from '../types/notification.types';

function buildNotificationStreamUrl(token: string): string {
  const baseUrl = appEnv.apiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/notifications/my/stream`);
  url.searchParams.set('access_token', token);
  return url.toString();
}

export function useNotificationLiveUpdates() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const lastToastedNotificationIdRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const seenEventIdsRef = useRef<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!token || typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
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

    const handleStreamEvent = (event: MessageEvent<string>) => {
      if (!rememberEventId(event.lastEventId || null)) {
        return;
      }

      const payload = JSON.parse(event.data) as NotificationStreamEventResponse;

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

    const connect = () => {
      clearReconnectTimeout();
      eventSourceRef.current?.close();

      const eventSource = new EventSource(buildNotificationStreamUrl(token));
      eventSourceRef.current = eventSource;

      const onMessage = (event: MessageEvent<string>) => {
        try {
          handleStreamEvent(event);
        } catch {
          scheduleInvalidateNotificationData();
        }
      };

      eventSource.addEventListener('connected', onMessage as EventListener);
      eventSource.addEventListener('notification-created', onMessage as EventListener);
      eventSource.addEventListener('notification-updated', onMessage as EventListener);
      eventSource.addEventListener('notifications-bulk-updated', onMessage as EventListener);
      eventSource.addEventListener('heartbeat', onMessage as EventListener);
      eventSource.onopen = () => {
        reconnectAttemptRef.current = 0;
      };
      eventSource.onerror = () => {
        eventSource.close();

        if (!isStopped) {
          reconnectAttemptRef.current += 1;
          const delay = Math.min(
            NOTIFICATION_SSE_RECONNECT_MS * 2 ** Math.min(reconnectAttemptRef.current - 1, 5),
            NOTIFICATION_SSE_MAX_RECONNECT_MS,
          );
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        }
      };
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        invalidateNotificationData();

        if (eventSourceRef.current?.readyState === EventSource.CLOSED && !isStopped) {
          connect();
        }
      } else {
        clearRefreshTimeout();
      }
    };

    connect();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isStopped = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearReconnectTimeout();
      clearRefreshTimeout();
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [queryClient, showSnackbar]);
}

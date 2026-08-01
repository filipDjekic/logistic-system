import { describe, expect, it } from 'vitest';
import { buildNotificationStreamUrl } from './useNotificationLiveUpdates';

describe('notification stream authentication', () => {
  it('never places the bearer token in the stream URL', () => {
    const url = new URL(buildNotificationStreamUrl());

    expect(url.pathname).toBe('/api/notifications/my/stream');
    expect(url.searchParams.has('access_token')).toBe(false);
  });
});

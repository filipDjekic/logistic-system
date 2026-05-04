package rs.logistics.logistics_system.security;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.exception.ConflictException;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final AppProperties appProperties;
    private final Map<String, CachedWriteResponse> responses = new ConcurrentHashMap<>();
    private final Map<String, Instant> inProgressKeys = new ConcurrentHashMap<>();
    private final Map<String, RateWindow> rateWindows = new ConcurrentHashMap<>();

    public Optional<CachedWriteResponse> getCachedResponse(String idempotencyKey) {
        if (!appProperties.getFailProtection().isEnabled() || isBlank(idempotencyKey)) {
            return Optional.empty();
        }

        cleanupExpiredIdempotencyEntries();
        return Optional.ofNullable(responses.get(idempotencyKey));
    }

    public void registerWriteRequest(String rateLimitKey, String idempotencyKey) {
        if (!appProperties.getFailProtection().isEnabled()) {
            return;
        }

        cleanupExpiredIdempotencyEntries();
        enforceRateLimit(rateLimitKey);

        if (isBlank(idempotencyKey)) {
            return;
        }

        if (responses.containsKey(idempotencyKey)) {
            return;
        }

        Instant now = Instant.now();
        Instant existing = inProgressKeys.putIfAbsent(idempotencyKey, now);
        if (existing != null && existing.plusSeconds(appProperties.getFailProtection().getIdempotencyTtlSeconds()).isAfter(now)) {
            throw new ConflictException("Duplicate write request is still being processed");
        }
    }

    public void storeWriteResponse(String idempotencyKey, int status, String contentType, byte[] body) {
        if (!appProperties.getFailProtection().isEnabled() || isBlank(idempotencyKey)) {
            return;
        }

        inProgressKeys.remove(idempotencyKey);
        responses.put(idempotencyKey, new CachedWriteResponse(Instant.now(), status, contentType, body == null ? new byte[0] : body));
    }

    public void clearInProgress(String idempotencyKey) {
        if (!isBlank(idempotencyKey)) {
            inProgressKeys.remove(idempotencyKey);
        }
    }

    private void enforceRateLimit(String rateLimitKey) {
        int limit = appProperties.getFailProtection().getWriteRequestsPerMinute();
        Instant now = Instant.now();
        RateWindow window = rateWindows.compute(rateLimitKey, (key, current) -> {
            if (current == null || current.windowStart.plusSeconds(60).isBefore(now)) {
                return new RateWindow(now, 1);
            }
            current.count++;
            return current;
        });

        if (window.count > limit) {
            throw new ConflictException("Too many write requests. Try again later");
        }
    }

    private void cleanupExpiredIdempotencyEntries() {
        Instant expiresBefore = Instant.now().minusSeconds(appProperties.getFailProtection().getIdempotencyTtlSeconds());
        responses.entrySet().removeIf(entry -> entry.getValue().createdAt().isBefore(expiresBefore));
        inProgressKeys.entrySet().removeIf(entry -> entry.getValue().isBefore(expiresBefore));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record CachedWriteResponse(Instant createdAt, int status, String contentType, byte[] body) {
    }

    private static class RateWindow {
        private final Instant windowStart;
        private int count;

        private RateWindow(Instant windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}

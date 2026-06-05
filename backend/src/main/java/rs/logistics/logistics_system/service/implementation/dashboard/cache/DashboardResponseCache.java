package rs.logistics.logistics_system.service.implementation.dashboard.cache;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Component
public class DashboardResponseCache {

    private static final Duration DEFAULT_TTL = Duration.ofSeconds(60);
    private final Map<String, CacheEntry> entries = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> T get(String key, Supplier<T> supplier) {
        Instant now = Instant.now();
        CacheEntry existing = entries.get(key);
        if (existing != null && existing.expiresAt().isAfter(now)) {
            return (T) existing.value();
        }

        T value = supplier.get();
        entries.put(key, new CacheEntry(value, now.plus(DEFAULT_TTL)));
        return value;
    }

    private record CacheEntry(Object value, Instant expiresAt) {
    }
}

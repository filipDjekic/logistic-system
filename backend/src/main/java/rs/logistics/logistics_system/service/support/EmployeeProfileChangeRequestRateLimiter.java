package rs.logistics.logistics_system.service.support;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.exception.ConflictException;

@Component
public class EmployeeProfileChangeRequestRateLimiter {

    private static final int MAX_REQUESTS_PER_WINDOW = 5;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final Map<Long, Deque<Instant>> attemptsByUserId = new ConcurrentHashMap<>();

    public void checkCreateAllowed(Long userId) {
        if (userId == null) {
            return;
        }

        Instant now = Instant.now();
        Instant threshold = now.minus(WINDOW);
        Deque<Instant> attempts = attemptsByUserId.computeIfAbsent(userId, ignored -> new ArrayDeque<>());

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(threshold)) {
                attempts.removeFirst();
            }
            if (attempts.size() >= MAX_REQUESTS_PER_WINDOW) {
                throw new ConflictException("Too many profile change requests. Try again later.");
            }
            attempts.addLast(now);
        }
    }
}

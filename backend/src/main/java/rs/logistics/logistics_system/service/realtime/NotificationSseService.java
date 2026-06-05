package rs.logistics.logistics_system.service.realtime;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.response.NotificationStreamEventResponse;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.repository.NotificationRepository;

@Service
@RequiredArgsConstructor
public class NotificationSseService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60L * 1000L;
    private static final long HEARTBEAT_INTERVAL_MS = 30L * 1000L;
    private static final long STALE_CONNECTION_MS = 2L * 60L * 1000L;
    private static final int MAX_CONNECTIONS_PER_USER = 3;

    private final NotificationRepository notificationRepository;
    private final Map<Long, Set<NotificationEmitterConnection>> emittersByUserId = new ConcurrentHashMap<>();
    private final AtomicLong eventSequence = new AtomicLong();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        NotificationEmitterConnection connection = new NotificationEmitterConnection(
                UUID.randomUUID().toString(),
                emitter,
                Instant.now()
        );

        emittersByUserId.computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>()).add(connection);
        enforceConnectionLimit(userId);

        emitter.onCompletion(() -> removeEmitter(userId, connection));
        emitter.onTimeout(() -> removeEmitter(userId, connection));
        emitter.onError(error -> removeEmitter(userId, connection));

        send(userId, connection, "connected", NotificationStreamEventResponse.connected(getUnreadCount(userId)));

        return emitter;
    }

    public void publishCreated(Long userId, NotificationResponse notification) {
        if (!isValidTarget(userId, notification)) {
            return;
        }
        publish(userId, "notification-created", NotificationStreamEventResponse.created(notification, getUnreadCount(userId)));
    }

    public void publishUpdated(Long userId, NotificationResponse notification) {
        if (!isValidTarget(userId, notification)) {
            return;
        }
        publish(userId, "notification-updated", NotificationStreamEventResponse.updated(notification, getUnreadCount(userId)));
    }

    public void publishBulkUpdated(Long userId) {
        if (userId == null) {
            return;
        }
        publish(userId, "notifications-bulk-updated", NotificationStreamEventResponse.bulkUpdated(getUnreadCount(userId)));
    }

    @Scheduled(fixedRate = HEARTBEAT_INTERVAL_MS)
    public void sendHeartbeats() {
        emittersByUserId.forEach((userId, connections) -> connections.forEach(connection ->
                send(userId, connection, "heartbeat", NotificationStreamEventResponse.heartbeat())
        ));
    }

    @Scheduled(fixedDelay = HEARTBEAT_INTERVAL_MS)
    public void cleanupStaleConnections() {
        Instant threshold = Instant.now().minus(Duration.ofMillis(STALE_CONNECTION_MS));
        emittersByUserId.forEach((userId, connections) -> connections.forEach(connection -> {
            if (connection.lastTouchedAt().isBefore(threshold)) {
                removeEmitter(userId, connection);
            }
        }));
    }

    private void publish(Long userId, String eventName, NotificationStreamEventResponse payload) {
        Set<NotificationEmitterConnection> connections = emittersByUserId.get(userId);
        if (connections == null || connections.isEmpty()) {
            return;
        }

        connections.forEach(connection -> send(userId, connection, eventName, payload));
    }

    private void send(Long userId,
                      NotificationEmitterConnection connection,
                      String eventName,
                      NotificationStreamEventResponse payload) {
        try {
            synchronized (connection.sendLock()) {
                connection.emitter().send(SseEmitter.event()
                        .name(eventName)
                        .id(buildEventId(userId, connection.id()))
                        .reconnectTime(HEARTBEAT_INTERVAL_MS)
                        .data(payload));
                connection.touch();
            }
        } catch (IOException | IllegalStateException ex) {
            removeEmitter(userId, connection);
        }
    }

    private void removeEmitter(Long userId, NotificationEmitterConnection connection) {
        Set<NotificationEmitterConnection> connections = emittersByUserId.get(userId);
        if (connections == null) {
            return;
        }

        connections.remove(connection);
        try {
            connection.emitter().complete();
        } catch (IllegalStateException ignored) {
            // Emitter is already closed.
        }

        if (connections.isEmpty()) {
            emittersByUserId.remove(userId);
        }
    }

    private void enforceConnectionLimit(Long userId) {
        Set<NotificationEmitterConnection> connections = emittersByUserId.get(userId);
        if (connections == null || connections.size() <= MAX_CONNECTIONS_PER_USER) {
            return;
        }

        connections.stream()
                .sorted(Comparator.comparing(NotificationEmitterConnection::createdAt))
                .limit(connections.size() - MAX_CONNECTIONS_PER_USER)
                .toList()
                .forEach(connection -> removeEmitter(userId, connection));
    }

    private boolean isValidTarget(Long userId, NotificationResponse notification) {
        return userId != null
                && notification != null
                && notification.getUserId() != null
                && userId.equals(notification.getUserId());
    }

    private String buildEventId(Long userId, String connectionId) {
        return userId + ":" + connectionId + ":" + eventSequence.incrementAndGet();
    }

    private long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    private static final class NotificationEmitterConnection {
        private final String id;
        private final SseEmitter emitter;
        private final Instant createdAt;
        private final Object sendLock = new Object();
        private volatile Instant lastTouchedAt;

        private NotificationEmitterConnection(String id, SseEmitter emitter, Instant createdAt) {
            this.id = id;
            this.emitter = emitter;
            this.createdAt = createdAt;
            this.lastTouchedAt = createdAt;
        }

        private String id() {
            return id;
        }

        private SseEmitter emitter() {
            return emitter;
        }

        private Instant createdAt() {
            return createdAt;
        }

        private Instant lastTouchedAt() {
            return lastTouchedAt;
        }

        private Object sendLock() {
            return sendLock;
        }

        private void touch() {
            this.lastTouchedAt = Instant.now();
        }
    }
}

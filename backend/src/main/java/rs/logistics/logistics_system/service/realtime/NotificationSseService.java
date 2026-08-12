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
import java.util.concurrent.atomic.AtomicBoolean;
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
        // Resolve everything that can fail before creating/registering the stream. This
        // lets MVC return its normal JSON error response instead of trying to serialize
        // ErrorResponse with an already selected text/event-stream content type.
        long unreadCount = getUnreadCount(userId);
        SseEmitter emitter = createEmitter();
        NotificationEmitterConnection connection = new NotificationEmitterConnection(
                UUID.randomUUID().toString(),
                emitter,
                Instant.now()
        );

        emittersByUserId.computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>()).add(connection);
        enforceConnectionLimit(userId);

        emitter.onCompletion(() -> unregisterEmitter(userId, connection));
        emitter.onTimeout(() -> completeEmitter(userId, connection));
        emitter.onError(error -> unregisterEmitter(userId, connection));

        send(userId, connection, "connected", NotificationStreamEventResponse.connected(unreadCount));

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
                completeEmitter(userId, connection);
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
        if (connection.isClosed()) {
            return;
        }
        try {
            synchronized (connection.sendLock()) {
                if (connection.isClosed()) {
                    return;
                }
                connection.emitter().send(SseEmitter.event()
                        .name(eventName)
                        .id(buildEventId(userId, connection.id()))
                        .reconnectTime(HEARTBEAT_INTERVAL_MS)
                        .data(payload));
                connection.touch();
            }
        } catch (IOException | IllegalStateException ex) {
            // A failed write means that the async response is no longer usable.
            // Only forget the connection; completing it would attempt another
            // operation against the already failed servlet response.
            unregisterEmitter(userId, connection);
        }
    }

    private boolean unregisterEmitter(Long userId, NotificationEmitterConnection connection) {
        if (!connection.close()) {
            return false;
        }
        Set<NotificationEmitterConnection> connections = emittersByUserId.get(userId);
        if (connections != null) {
            connections.remove(connection);
        }
        if (connections != null && connections.isEmpty()) {
            emittersByUserId.remove(userId, connections);
        }
        return true;
    }

    private void completeEmitter(Long userId, NotificationEmitterConnection connection) {
        if (!unregisterEmitter(userId, connection)) {
            return;
        }
        try {
            connection.emitter().complete();
        } catch (IllegalStateException ignored) {
            // A timeout/container completion can win the race after unregister.
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
                .forEach(connection -> completeEmitter(userId, connection));
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

    SseEmitter createEmitter() {
        return new SseEmitter(EMITTER_TIMEOUT_MS);
    }

    private static final class NotificationEmitterConnection {
        private final String id;
        private final SseEmitter emitter;
        private final Instant createdAt;
        private final Object sendLock = new Object();
        private final AtomicBoolean closed = new AtomicBoolean();
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

        private boolean close() {
            return closed.compareAndSet(false, true);
        }

        private boolean isClosed() {
            return closed.get();
        }
    }
}

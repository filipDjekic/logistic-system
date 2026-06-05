package rs.logistics.logistics_system.dto.response;

public record NotificationStreamEventResponse(
        String eventType,
        NotificationResponse notification,
        Long unreadCount
) {
    public static NotificationStreamEventResponse connected(Long unreadCount) {
        return new NotificationStreamEventResponse("CONNECTED", null, unreadCount);
    }

    public static NotificationStreamEventResponse created(NotificationResponse notification, Long unreadCount) {
        return new NotificationStreamEventResponse("CREATED", notification, unreadCount);
    }

    public static NotificationStreamEventResponse updated(NotificationResponse notification, Long unreadCount) {
        return new NotificationStreamEventResponse("UPDATED", notification, unreadCount);
    }

    public static NotificationStreamEventResponse bulkUpdated(Long unreadCount) {
        return new NotificationStreamEventResponse("BULK_UPDATED", null, unreadCount);
    }

    public static NotificationStreamEventResponse heartbeat() {
        return new NotificationStreamEventResponse("HEARTBEAT", null, null);
    }
}

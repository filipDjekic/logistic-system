package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSourceType;

public interface NotificationServiceDefinition {

    NotificationResponse create(NotificationCreate dto);

    NotificationResponse getById(Long id);

    void delete(Long id);

    NotificationResponse markAsRead(Long id);

    NotificationResponse acknowledge(Long id);

    NotificationResponse resolve(Long id);

    void markAllAsRead(Long userId);

    NotificationPageResponse getByUser(Long userId, int page, int size);

    NotificationPageResponse getByUser(Long userId, NotificationStatus status, NotificationType type, NotificationSeverity severity, NotificationCategory category, int page, int size);

    NotificationPageResponse getByUser(Long userId, NotificationStatus status, NotificationType type, int page, int size);

    NotificationPageResponse getByUserAndStatus(Long userId, NotificationStatus status, int page, int size);

    long getUnreadCount(Long userId);

    NotificationResponse createSystemNotification(Long userId, String title, String message, NotificationType type);

    NotificationResponse createInternalSystemNotification(Long userId, String title, String message, NotificationType type);

    NotificationResponse createOperationalNotification(Long userId, String title, String message, NotificationType type, NotificationSeverity severity, NotificationCategory category, NotificationSourceType sourceType, Long sourceId, String dedupKey);
}

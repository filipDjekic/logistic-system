package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.update.NotificationUpdate;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;

import java.util.List;

public interface NotificationServiceDefinition {

    NotificationResponse create(NotificationCreate dto);

    NotificationResponse getById(Long id);

    void delete(Long id);

    NotificationResponse markAsRead(Long id);

    void markAllAsRead(Long userId);

    NotificationPageResponse getByUser(Long userId, int page, int size);

    NotificationPageResponse getByUserAndStatus(Long userId, NotificationStatus status, int page, int size);

    long getUnreadCount(Long userId);

    NotificationResponse createSystemNotification(Long userId, String title, String message, NotificationType type);
}

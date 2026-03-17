package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.update.NotificationUpdate;
import rs.logistics.logistics_system.enums.NotificationStatus;

import java.util.List;

public interface NotificationServiceDefinition {

    NotificationResponse create(NotificationCreate dto);

    NotificationResponse update(Long id, NotificationUpdate dto);

    NotificationResponse getById(Long id);

    List<NotificationResponse> getAll();

    void delete(Long id);

    List<NotificationResponse> getByUserId(Long userId);

    List<NotificationResponse> getByStatus(Long userId, NotificationStatus status);

    NotificationResponse markAsRead(Long id);

    void markAllAsRead(Long userId);
}

package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.NotificationStatus;

public class NotificationMapper {

    public static Notification toEntity(NotificationCreate dto, User user) {
        Notification notification = new Notification(
                dto.getTitle(),
                dto.getMessage(),
                dto.getType(),
                NotificationStatus.UNREAD,
                user,
                dto.getSeverity(),
                dto.getCategory(),
                dto.getSourceType(),
                dto.getSourceId(),
                dto.getDedupKey()
        );
        return notification;
    }

    public static NotificationResponse toResponse(Notification notification){
        NotificationResponse notificationResponse = new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getStatus(),
                notification.getSeverity(),
                notification.getCategory(),
                notification.getSourceType(),
                notification.getSourceId(),
                notification.getDedupKey(),
                notification.getEscalatedAt(),
                notification.getUser().getId(),
                notification.getCreatedAt()
        );
        return notificationResponse;
    }
}

package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.update.NotificationUpdate;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.entity.User;

public class NotificationMapper {

    public static Notification toEntity(NotificationCreate dto, User user) {
        Notification notification = new Notification(
                dto.getTitle(),
                dto.getMessage(),
                dto.getType(),
                dto.getStatus(),
                user
        );
        return notification;
    }

    public static void updateEntity(NotificationUpdate dto, Notification notification, User user) {
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notification.setType(dto.getType());
        notification.setStatus(dto.getStatus());
        notification.setUser(user);
    }

    public static NotificationResponse toResponse(Notification notification){
        NotificationResponse notificationResponse = new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getStatus(),
                notification.getUser().getId()
        );
        return notificationResponse;
    }
}

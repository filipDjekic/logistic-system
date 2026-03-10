package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class NotificationCreate {

    private String title;
    private String message;
    private NotificationType type;
    private NotificationStatus status;

    private Long userId;

    public NotificationCreate() {}

    public NotificationCreate(String title, String message, NotificationType type, NotificationStatus status, Long userId) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.userId = userId;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public NotificationType getType() {
        return type;
    }
    public void setType(NotificationType type) {
        this.type = type;
    }
    public NotificationStatus getStatus() {
        return status;
    }
    public void setStatus(NotificationStatus status) {
        this.status = status;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}

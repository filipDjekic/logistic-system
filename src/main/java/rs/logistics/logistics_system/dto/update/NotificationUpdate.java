package rs.logistics.logistics_system.dto.update;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;

@Getter
@Setter
@NoArgsConstructor

public class NotificationUpdate {

    private Long id;

    private String title;
    private String message;
    private NotificationType type;
    private NotificationStatus status;

    private Long userId;

    public NotificationUpdate(Long id, String title, String message, NotificationType type, NotificationStatus status, Long userId) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.userId = userId;
    }
}

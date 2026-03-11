package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class NotificationCreate {

    private String title;
    private String message;
    private NotificationType type;
    private NotificationStatus status;

    private Long userId;

    public NotificationCreate(String title, String message, NotificationType type, NotificationStatus status, Long userId) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.userId = userId;
    }
}

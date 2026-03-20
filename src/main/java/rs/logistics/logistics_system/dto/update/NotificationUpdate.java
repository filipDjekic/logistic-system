package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @NotNull
    @Size(min = 1, max = 100)
    private String title;

    @NotNull
    @Size(min = 1, max = 500)
    private String message;

    @NotNull
    private NotificationType type;

    @NotNull
    private NotificationStatus status;

    @NotNull
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

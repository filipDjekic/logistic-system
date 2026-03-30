package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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

    @NotBlank
    @Size(min = 1, max = 100)
    private String title;

    @NotBlank
    @Size(min = 1, max = 500)
    private String message;

    @NotNull
    private NotificationType type;

    @NotNull
    @Positive
    private Long userId;

    public NotificationCreate(String title,
                              String message,
                              NotificationType type,
                              Long userId) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.userId = userId;
    }
}

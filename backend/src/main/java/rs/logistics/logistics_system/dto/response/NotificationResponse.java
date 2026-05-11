package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSourceType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class NotificationResponse {

    private Long id;

    private String title;
    private String message;
    private NotificationType type;
    private NotificationStatus status;
    private NotificationSeverity severity;
    private NotificationCategory category;
    private NotificationSourceType sourceType;
    private Long sourceId;
    private String dedupKey;
    private LocalDateTime escalatedAt;
    private LocalDateTime createdAt;

    private Long userId;

    public NotificationResponse(Long id,
                                String title,
                                String message,
                                NotificationType type,
                                NotificationStatus status,
                                Long userId,
                                LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.userId = userId;
        this.createdAt = createdAt;
    }

    public NotificationResponse(Long id,
                                String title,
                                String message,
                                NotificationType type,
                                NotificationStatus status,
                                NotificationSeverity severity,
                                NotificationCategory category,
                                NotificationSourceType sourceType,
                                Long sourceId,
                                String dedupKey,
                                LocalDateTime escalatedAt,
                                Long userId,
                                LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.severity = severity;
        this.category = category;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.dedupKey = dedupKey;
        this.escalatedAt = escalatedAt;
        this.userId = userId;
        this.createdAt = createdAt;
    }
}

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
    private String groupKey;
    private Integer groupCount;
    private LocalDateTime lastGroupedAt;
    private LocalDateTime escalatedAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
    private String actionLabel;
    private String actionPath;
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
                                String groupKey,
                                Integer groupCount,
                                LocalDateTime lastGroupedAt,
                                LocalDateTime escalatedAt,
                                LocalDateTime acknowledgedAt,
                                LocalDateTime resolvedAt,
                                String actionLabel,
                                String actionPath,
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
        this.groupKey = groupKey;
        this.groupCount = groupCount;
        this.lastGroupedAt = lastGroupedAt;
        this.escalatedAt = escalatedAt;
        this.acknowledgedAt = acknowledgedAt;
        this.resolvedAt = resolvedAt;
        this.actionLabel = actionLabel;
        this.actionPath = actionPath;
        this.userId = userId;
        this.createdAt = createdAt;
    }
}

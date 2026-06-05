package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSourceType;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "NOTIFICATIONS",
        indexes = {
                @Index(name = "idx_notifications_user_status_created", columnList = "user_id, status, created_at"),
                @Index(name = "idx_notifications_user_severity_status", columnList = "user_id, severity, status"),
                @Index(name = "idx_notifications_category_status", columnList = "category, status"),
                @Index(name = "idx_notifications_dedup_key", columnList = "dedup_key"),
                @Index(name = "idx_notifications_group_key", columnList = "user_id, group_key, status"),
                @Index(name = "idx_notifications_status_created", columnList = "status, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private NotificationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private NotificationSeverity severity = NotificationSeverity.INFO;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private NotificationCategory category = NotificationCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 40)
    private NotificationSourceType sourceType = NotificationSourceType.SYSTEM;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "dedup_key", length = 180)
    private String dedupKey;

    @Column(name = "group_key", length = 180)
    private String groupKey;

    @Column(name = "group_count", nullable = false)
    private Integer groupCount = 1;

    @Column(name = "last_grouped_at")
    private LocalDateTime lastGroupedAt;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "action_label", length = 80)
    private String actionLabel;

    @Column(name = "action_path", length = 220)
    private String actionPath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Notification(String title, String message, NotificationType type, NotificationStatus status, User user) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.user = user;
        this.severity = mapSeverity(type);
        this.category = NotificationCategory.GENERAL;
        this.sourceType = NotificationSourceType.SYSTEM;
    }

    public Notification(String title,
                        String message,
                        NotificationType type,
                        NotificationStatus status,
                        User user,
                        NotificationSeverity severity,
                        NotificationCategory category,
                        NotificationSourceType sourceType,
                        Long sourceId,
                        String dedupKey) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.status = status;
        this.user = user;
        this.severity = severity != null ? severity : mapSeverity(type);
        this.category = category != null ? category : NotificationCategory.GENERAL;
        this.sourceType = sourceType != null ? sourceType : NotificationSourceType.SYSTEM;
        this.sourceId = sourceId;
        this.dedupKey = dedupKey;
        this.groupKey = dedupKey;
        this.groupCount = 1;
    }

    // methods

    public boolean isUnread() {
        return this.status == NotificationStatus.UNREAD;
    }

    public void markAsRead() {
        if(this.status == NotificationStatus.UNREAD) {
            this.status = NotificationStatus.READ;
        }
    }

    public void markEscalated() {
        if (this.escalatedAt == null) {
            this.escalatedAt = LocalDateTime.now();
        }
    }

    public void acknowledge() {
        if (this.status == NotificationStatus.RESOLVED) {
            return;
        }
        this.status = NotificationStatus.ACKNOWLEDGED;
        this.acknowledgedAt = LocalDateTime.now();
    }

    public void resolve() {
        this.status = NotificationStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        if (this.acknowledgedAt == null) {
            this.acknowledgedAt = this.resolvedAt;
        }
    }

    public boolean isActionable() {
        return this.status == NotificationStatus.UNREAD || this.status == NotificationStatus.ACKNOWLEDGED;
    }

    public void registerGroupedOccurrence(String latestTitle, String latestMessage) {
        if (latestTitle != null && !latestTitle.isBlank()) {
            this.title = latestTitle;
        }
        if (latestMessage != null && !latestMessage.isBlank()) {
            this.message = latestMessage;
        }
        this.groupCount = this.groupCount == null || this.groupCount < 1 ? 2 : this.groupCount + 1;
        this.lastGroupedAt = LocalDateTime.now();
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (this.severity == null) {
            this.severity = mapSeverity(this.type);
        }
        if (this.category == null) {
            this.category = NotificationCategory.GENERAL;
        }
        if (this.sourceType == null) {
            this.sourceType = NotificationSourceType.SYSTEM;
        }
        if (this.dedupKey != null) {
            this.dedupKey = this.dedupKey.trim();
        }
        if (this.groupKey != null) {
            this.groupKey = this.groupKey.trim();
        }
        if (this.groupKey == null && this.dedupKey != null) {
            this.groupKey = this.dedupKey;
        }
        if (this.groupCount == null || this.groupCount < 1) {
            this.groupCount = 1;
        }
        if (this.actionLabel == null) {
            this.actionLabel = defaultActionLabel(this.sourceType);
        }
        if (this.actionPath == null) {
            this.actionPath = defaultActionPath(this.sourceType, this.sourceId);
        }
        if (this.title != null) {
            this.title = this.title.trim();
        }
        if (this.message != null) {
            this.message = this.message.trim();
        }
    }

    private String defaultActionLabel(NotificationSourceType sourceType) {
        if (sourceType == NotificationSourceType.TRANSPORT_ORDER) {
            return "Open transport";
        }
        if (sourceType == NotificationSourceType.WAREHOUSE_INVENTORY) {
            return "Open inventory";
        }
        if (sourceType == NotificationSourceType.STOCK_MOVEMENT) {
            return "Open movement";
        }
        if (sourceType == NotificationSourceType.TASK) {
            return "Open task";
        }
        if (sourceType == NotificationSourceType.SHIFT) {
            return "Open shift";
        }
        if (sourceType == NotificationSourceType.WAREHOUSE) {
            return "Open warehouse";
        }
        if (sourceType == NotificationSourceType.USER) {
            return "Open user";
        }
        return null;
    }

    private String defaultActionPath(NotificationSourceType sourceType, Long sourceId) {
        if (sourceType == null || sourceId == null) {
            return null;
        }
        return switch (sourceType) {
            case TRANSPORT_ORDER -> "/transport-orders/" + sourceId;
            case WAREHOUSE_INVENTORY -> "/inventory/" + sourceId;
            case STOCK_MOVEMENT -> "/stock-movements/" + sourceId;
            case TASK -> "/tasks/" + sourceId;
            case SHIFT -> "/shifts/" + sourceId;
            case WAREHOUSE -> "/warehouses/" + sourceId;
            case USER -> "/users/" + sourceId;
            default -> null;
        };
    }

    private NotificationSeverity mapSeverity(NotificationType type) {
        if (type == NotificationType.ERROR) {
            return NotificationSeverity.CRITICAL;
        }
        if (type == NotificationType.WARNING) {
            return NotificationSeverity.WARNING;
        }
        if (type == NotificationType.SUCCESS) {
            return NotificationSeverity.SUCCESS;
        }
        return NotificationSeverity.INFO;
    }
}

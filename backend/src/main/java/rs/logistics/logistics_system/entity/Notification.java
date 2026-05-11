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
                @Index(name = "idx_notifications_dedup_key", columnList = "dedup_key")
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

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

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
        this.escalatedAt = LocalDateTime.now();
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
        if (this.title != null) {
            this.title = this.title.trim();
        }
        if (this.message != null) {
            this.message = this.message.trim();
        }
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

package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ACTIVITY_LOGS")
@Getter
@Setter
@NoArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entity_name", nullable = false, length = 100)
    private String entityName;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_identifier", length = 255)
    private String entityIdentifier;

    @Column(name = "description", length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public ActivityLog(String action,
                       String entityName,
                       Long entityId,
                       String entityIdentifier,
                       String description,
                       User user) {
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.entityIdentifier = entityIdentifier;
        this.description = description;
        this.user = user;
    }

    public ActivityLog(String action,
                       String entityName,
                       Long entityId,
                       String description,
                       User user) {
        this(action, entityName, entityId, null, description, user);
    }
}

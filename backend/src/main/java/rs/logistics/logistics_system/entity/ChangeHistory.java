package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.ChangeType;

import java.time.LocalDateTime;

@Entity
@Table(name = "CHANGE_HISTORY")
@Getter
@Setter
@NoArgsConstructor
public class ChangeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "entity_name", nullable = false, length = 100)
    private String entityName;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "entity_identifier", length = 255)
    private String entityIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 30)
    private ChangeType changeType;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "old_value", length = 1000)
    private String oldValue;

    @Column(name = "new_value", length = 1000)
    private String newValue;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private User changedBy;

    public ChangeHistory(String entityName,
                         Long entityId,
                         String entityIdentifier,
                         ChangeType changeType,
                         String fieldName,
                         String oldValue,
                         String newValue,
                         User changedBy) {
        this.entityName = entityName;
        this.entityId = entityId;
        this.entityIdentifier = entityIdentifier;
        this.changeType = changeType;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedBy = changedBy;
    }

    public ChangeHistory(String entityName,
                         Long entityId,
                         ChangeType changeType,
                         String fieldName,
                         String oldValue,
                         String newValue,
                         User changedBy) {
        this(entityName, entityId, null, changeType, fieldName, oldValue, newValue, changedBy);
    }
}

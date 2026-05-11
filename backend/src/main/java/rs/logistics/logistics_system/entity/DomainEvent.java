package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "DOMAIN_EVENTS",
        indexes = {
                @Index(name = "idx_domain_events_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_domain_events_company_created", columnList = "company_id, created_at"),
                @Index(name = "idx_domain_events_type", columnList = "event_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class DomainEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 80)
    private DomainEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 60)
    private OperationalEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "entity_identifier", length = 255)
    private String entityIdentifier;

    @Column(name = "summary", nullable = false, length = 500)
    private String summary;

    @Column(name = "payload", length = 4000)
    private String payload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

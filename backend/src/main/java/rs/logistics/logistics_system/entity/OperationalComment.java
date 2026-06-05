package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "OPERATIONAL_COMMENTS",
        indexes = {
                @Index(name = "idx_operational_comments_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_operational_comments_entity_created", columnList = "entity_type, entity_id, created_at"),
                @Index(name = "idx_operational_comments_company_created", columnList = "company_id, created_at"),
                @Index(name = "idx_operational_comments_author", columnList = "author_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class OperationalComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 60)
    private OperationalEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Column(name = "internal_note", nullable = false)
    private Boolean internalNote = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

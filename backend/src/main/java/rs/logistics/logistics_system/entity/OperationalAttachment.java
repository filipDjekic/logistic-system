package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.OperationalAttachmentType;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "OPERATIONAL_ATTACHMENTS",
        indexes = {
                @Index(name = "idx_operational_attachments_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_operational_attachments_entity_created", columnList = "entity_type, entity_id, created_at"),
                @Index(name = "idx_operational_attachments_company_created", columnList = "company_id, created_at"),
                @Index(name = "idx_operational_attachments_uploaded_by", columnList = "uploaded_by_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class OperationalAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 60)
    private OperationalEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false, length = 40)
    private OperationalAttachmentType attachmentType = OperationalAttachmentType.DOCUMENT;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", length = 120)
    private String contentType;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "description", length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

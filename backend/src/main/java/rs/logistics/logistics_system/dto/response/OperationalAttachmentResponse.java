package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.OperationalAttachmentType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class OperationalAttachmentResponse {
    private Long id;
    private OperationalEntityType entityType;
    private Long entityId;
    private OperationalAttachmentType attachmentType;
    private String fileName;
    private String contentType;
    private String fileUrl;
    private Long sizeBytes;
    private String description;
    private Long companyId;
    private Long uploadedById;
    private String uploadedByEmail;
    private String uploadedByName;
    private LocalDateTime createdAt;
}

package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class OperationalCommentResponse {
    private Long id;
    private OperationalEntityType entityType;
    private Long entityId;
    private String content;
    private Boolean internalNote;
    private Long companyId;
    private Long authorId;
    private String authorEmail;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class DomainEventResponse {
    private Long id;
    private DomainEventType eventType;
    private OperationalEntityType entityType;
    private Long entityId;
    private String entityIdentifier;
    private String summary;
    private String payload;
    private Long companyId;
    private Long createdById;
    private String createdByEmail;
    private String createdByName;
    private LocalDateTime createdAt;
}

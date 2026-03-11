package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ActivityLogResponse {

    public Long id;

    private String action;
    private String entityName;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;

    private Long userId;

    public ActivityLogResponse(Long id, String action, String entityName, Long entityId, String description, LocalDateTime createdAt, Long userId) {
        this.id = id;
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.description = description;
        this.userId = userId;
        this.createdAt = createdAt;
    }
}

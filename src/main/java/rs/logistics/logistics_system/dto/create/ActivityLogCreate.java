package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ActivityLogCreate {

    private String action;
    private String entityName;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;

    private Long userId;

    public ActivityLogCreate(String action, String entityName, Long entityId, String description, LocalDateTime createdAt, Long userId) {
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.description = description;
        this.userId = userId;
        this.createdAt = createdAt;
    }
}

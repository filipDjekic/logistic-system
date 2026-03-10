package rs.logistics.logistics_system.dto.create;

import java.time.LocalDateTime;

public class ActivityLogCreate {

    private String action;
    private String entityName;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;

    private Long userId;

    public ActivityLogCreate() {}

    public ActivityLogCreate(String action, String entityName, Long entityId, String description, LocalDateTime createdAt, Long userId) {
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.description = description;
        this.userId = userId;
        this.createdAt = createdAt;
    }

    public String getAction() {
        return action;
    }
    public void setAction(String action) {
        this.action = action;
    }
    public String getEntityName() {
        return entityName;
    }
    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }
    public Long getEntityId() {
        return entityId;
    }
    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}

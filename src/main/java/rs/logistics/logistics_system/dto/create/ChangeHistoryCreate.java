package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.enums.ChangeType;

public class ChangeHistoryCreate {

    private String entityName;
    private Long entityId;
    private ChangeType changeType;
    private String fieldName;
    private String oldValue;
    private String newValue;

    private Long userId;

    public  ChangeHistoryCreate() {}

    public ChangeHistoryCreate(String entityName, Long entityId, ChangeType changeType, String fieldName, String oldValue, String newValue, Long userId) {
        this.entityName = entityName;
        this.entityId = entityId;
        this.changeType = changeType;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.userId = userId;
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
    public ChangeType getChangeType() {
        return changeType;
    }
    public void setChangeType(ChangeType changeType) {
        this.changeType = changeType;
    }
    public String getFieldName() {
        return fieldName;
    }
    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }
    public String getOldValue() {
        return oldValue;
    }
    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }
    public String getNewValue() {
        return newValue;
    }
    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}

package rs.logistics.logistics_system.service.definition;

public interface AuditFacadeDefinition {
    void log(String action, String entityName, Long entityId, String description);

    void recordCreate(String entityName, Long entityId);

    void recordDelete(String entityName, Long entityId);

    void recordFieldChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue);

    void recordStatusChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue);
}

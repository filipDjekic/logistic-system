package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.entity.User;

public interface AuditFacadeDefinition {
    void log(String action, String entityName, Long entityId, String description);

    void log(String action, String entityName, Long entityId, String description, User actor);

    void log(String action, String entityName, Long entityId, String entityIdentifier, String description);

    void log(String action, String entityName, Long entityId, String entityIdentifier, String description, User actor);

    void recordCreate(String entityName, Long entityId);

    void recordCreate(String entityName, Long entityId, String entityIdentifier);

    void recordDelete(String entityName, Long entityId);

    void recordDelete(String entityName, Long entityId, String entityIdentifier);

    void recordFieldChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue);

    void recordFieldChange(String entityName, Long entityId, String entityIdentifier, String fieldName, Object oldValue, Object newValue);

    void recordStatusChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue);

    void recordStatusChange(String entityName, Long entityId, String entityIdentifier, String fieldName, Object oldValue, Object newValue);
}

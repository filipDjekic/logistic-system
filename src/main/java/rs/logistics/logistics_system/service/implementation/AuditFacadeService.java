package rs.logistics.logistics_system.service.implementation;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuditFacadeService implements AuditFacadeDefinition {

    private final ActivityLogRepository activityLogRepository;
    private final ChangeHistoryRepository changeHistoryRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public void log(String action, String entityName, Long entityId, String description) {
        User actor = authenticatedUserProvider.getAuthenticatedUser();

        ActivityLog activityLog = new ActivityLog(
                action,
                entityName,
                entityId,
                description,
                actor
        );

        activityLogRepository.save(activityLog);
    }

    @Override
    public void recordCreate(String entityName, Long entityId) {
        User actor = authenticatedUserProvider.getAuthenticatedUser();

        ChangeHistory changeHistory = new ChangeHistory(
                entityName,
                entityId,
                ChangeType.CREATE,
                "ENTITY",
                null,
                "INITIAL_STATE",
                actor
        );

        changeHistoryRepository.save(changeHistory);
    }

    @Override
    public void recordDelete(String entityName, Long entityId) {
        User actor = authenticatedUserProvider.getAuthenticatedUser();

        ChangeHistory changeHistory = new ChangeHistory(
                entityName,
                entityId,
                ChangeType.DELETE,
                "ENTITY",
                "EXISTING_STATE",
                null,
                actor
        );

        changeHistoryRepository.save(changeHistory);
    }

    @Override
    public void recordFieldChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue) {
        if (!hasRealChange(oldValue, newValue)) {
            return;
        }

        User actor = authenticatedUserProvider.getAuthenticatedUser();

        ChangeHistory changeHistory = new ChangeHistory(
                entityName,
                entityId,
                ChangeType.UPDATE,
                fieldName,
                normalizeValue(oldValue),
                normalizeValue(newValue),
                actor
        );

        changeHistoryRepository.save(changeHistory);
    }

    @Override
    public void recordStatusChange(String entityName, Long entityId, String fieldName, Object oldValue, Object newValue) {
        if (!hasRealChange(oldValue, newValue)) {
            return;
        }

        User actor = authenticatedUserProvider.getAuthenticatedUser();

        ChangeHistory changeHistory = new ChangeHistory(
                entityName,
                entityId,
                ChangeType.STATUS_CHANGE,
                fieldName,
                normalizeValue(oldValue),
                normalizeValue(newValue),
                actor
        );

        changeHistoryRepository.save(changeHistory);
    }

    // helpers

    private boolean hasRealChange(Object oldValue, Object newValue) {
        return !Objects.equals(normalizeValue(oldValue), normalizeValue(newValue));
    }

    private String normalizeValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}

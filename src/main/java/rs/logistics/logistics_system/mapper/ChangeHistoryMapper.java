package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.entity.User;

public class ChangeHistoryMapper {

    public static ChangeHistory toEntity(ChangeHistoryCreate dto, User user){
        ChangeHistory changeHistory = new ChangeHistory(
                dto.getEntityName(),
                dto.getEntityId(),
                dto.getChangeType(),
                dto.getFieldName(),
                dto.getOldValue(),
                dto.getNewValue(),
                user
        );
        return changeHistory;
    }

    public static void updateEntity(ChangeHistory changeHistory, ChangeHistoryCreate dto, User user){
        changeHistory.setEntityName(dto.getEntityName());
        changeHistory.setEntityId(dto.getEntityId());
        changeHistory.setChangeType(dto.getChangeType());
        changeHistory.setFieldName(dto.getFieldName());
        changeHistory.setOldValue(dto.getOldValue());
        changeHistory.setNewValue(dto.getNewValue());
        changeHistory.setChangedBy(user);
    }

    public static ChangeHistoryResponse toResponse(ChangeHistory changeHistory, User user){
        ChangeHistoryResponse changeHistoryResponse = new ChangeHistoryResponse(
                changeHistory.getId(),
                changeHistory.getEntityName(),
                changeHistory.getEntityId(),
                changeHistory.getChangeType(),
                changeHistory.getFieldName(),
                changeHistory.getOldValue(),
                changeHistory.getNewValue(),
                changeHistory.getChangedBy().getId()
        );
        return changeHistoryResponse;
    }
}

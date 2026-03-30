package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.update.ChangeHistoryUpdate;

import java.time.LocalDateTime;
import java.util.List;

public interface ChangeHistoryServiceDefinition {

    ChangeHistoryResponse getById(Long id);

    List<ChangeHistoryResponse> getAll();

    List<ChangeHistoryResponse> getByEntityName(String entityName);

    List<ChangeHistoryResponse> getByEntityId(Long entityId);

    List<ChangeHistoryResponse> getByUserId(Long userId);

    List<ChangeHistoryResponse> getByBetweenDate(LocalDateTime start, LocalDateTime end);
}

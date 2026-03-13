package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.update.ChangeHistoryUpdate;

import java.util.List;

public interface ChangeHistoryServiceDefinition {

    ChangeHistoryResponse create(ChangeHistoryCreate dto);

    ChangeHistoryResponse update(Long id, ChangeHistoryUpdate dto);

    ChangeHistoryResponse getById(Long id);

    List<ChangeHistoryResponse> getAll();

    void delete(Long id);
}

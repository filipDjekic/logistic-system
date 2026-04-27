package rs.logistics.logistics_system.service.definition;

import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.enums.ChangeType;

import java.time.LocalDateTime;
import java.util.List;

public interface ChangeHistoryServiceDefinition {

    ChangeHistoryResponse getById(Long id);

    List<ChangeHistoryResponse> getAll();

    PageResponse<ChangeHistoryResponse> search(String search, ChangeType changeType, String entityName, Long entityId, Long userId, Pageable pageable);

    List<ChangeHistoryResponse> getByEntityName(String entityName);

    List<ChangeHistoryResponse> getByEntityId(Long entityId);

    List<ChangeHistoryResponse> getByUserId(Long userId);

    List<ChangeHistoryResponse> getByBetweenDate(LocalDateTime start, LocalDateTime end);
}

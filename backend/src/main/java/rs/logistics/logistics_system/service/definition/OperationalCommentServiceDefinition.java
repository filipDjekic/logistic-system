package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.OperationalCommentCreate;
import rs.logistics.logistics_system.dto.response.OperationalCommentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;

public interface OperationalCommentServiceDefinition {
    OperationalCommentResponse create(OperationalCommentCreate dto);
    List<OperationalCommentResponse> getForEntity(OperationalEntityType entityType, Long entityId);
    void delete(Long id);
}

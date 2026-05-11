package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.OperationalAttachmentCreate;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;

public interface OperationalAttachmentServiceDefinition {
    OperationalAttachmentResponse create(OperationalAttachmentCreate dto);
    List<OperationalAttachmentResponse> getForEntity(OperationalEntityType entityType, Long entityId);
    void delete(Long id);
}

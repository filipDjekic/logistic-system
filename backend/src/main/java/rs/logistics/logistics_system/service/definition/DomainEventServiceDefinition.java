package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.DomainEventCreate;
import rs.logistics.logistics_system.dto.response.DomainEventResponse;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;

public interface DomainEventServiceDefinition {
    DomainEventResponse create(DomainEventCreate dto);
    DomainEventResponse record(DomainEventType eventType, OperationalEntityType entityType, Long entityId, String entityIdentifier, String summary, String payload, Long companyId);
    List<DomainEventResponse> getForEntity(OperationalEntityType entityType, Long entityId);
    List<DomainEventResponse> getRecent();
}

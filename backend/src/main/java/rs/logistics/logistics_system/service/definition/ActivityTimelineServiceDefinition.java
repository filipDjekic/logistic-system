package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.response.ActivityTimelineItemResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;

public interface ActivityTimelineServiceDefinition {
    List<ActivityTimelineItemResponse> getForEntity(OperationalEntityType entityType, Long entityId);
    List<ActivityTimelineItemResponse> getRecent();
}

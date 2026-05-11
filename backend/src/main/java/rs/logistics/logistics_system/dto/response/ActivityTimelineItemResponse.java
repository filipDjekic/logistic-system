package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ActivityTimelineItemType;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTimelineItemResponse {
    private ActivityTimelineItemType type;
    private Long sourceId;
    private OperationalEntityType entityType;
    private Long entityId;
    private String title;
    private String description;
    private String actorName;
    private String actorEmail;
    private LocalDateTime occurredAt;
}

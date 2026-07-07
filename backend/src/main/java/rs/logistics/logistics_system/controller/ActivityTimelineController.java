package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.ActivityTimelineItemResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.service.definition.ActivityTimelineServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/activity-timeline")
@RequiredArgsConstructor
public class ActivityTimelineController {

    private final ActivityTimelineServiceDefinition activityTimelineService;

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping
    public ResponseEntity<List<ActivityTimelineItemResponse>> getForEntity(@RequestParam OperationalEntityType entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(activityTimelineService.getForEntity(entityType, entityId));
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/recent")
    public ResponseEntity<List<ActivityTimelineItemResponse>> getRecent() {
        return ResponseEntity.ok(activityTimelineService.getRecent());
    }
}

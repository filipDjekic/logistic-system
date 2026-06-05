package rs.logistics.logistics_system.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record LifecycleAnalyticsResponse(
        LocalDateTime generatedAt,
        List<LifecycleAlertResponse> alerts,
        Map<String, Long> tasksByStatus,
        Map<String, Long> transportsByStatus,
        Map<String, Long> vehiclesByStatus,
        long overdueTasks,
        long blockedTasks,
        long stuckTasks,
        long overdueTransports,
        long staleReservedVehicles,
        long activeOperationalFlows
) {
}

package rs.logistics.logistics_system.dto.response.dashboard;

import java.time.LocalDateTime;
import java.util.List;

public record OperationalDashboardResponse(
        LocalDateTime generatedAt,
        String title,
        String description,
        String emptyMessage,
        List<OperationalWidgetResponse> widgets,
        List<OperationalFlowResponse> flows,
        List<OperationalNextActionResponse> nextActions,
        List<OperationalLiveAlertResponse> liveAlerts,
        List<OperationalIncidentResponse> incidents,
        List<OperationalWorkloadResponse> workload,
        List<OperationalWarehouseCongestionResponse> warehouseCongestion,
        OperationalSlaResponse sla
) {
    public record OperationalWidgetResponse(
            String key,
            String title,
            String description,
            long value,
            String severity,
            String route,
            String actionLabel
    ) {
    }

    public record OperationalFlowResponse(
            String key,
            String title,
            String description,
            String entityType,
            Long entityId,
            String route,
            String status,
            String severity,
            LocalDateTime dueAt
    ) {
    }

    public record OperationalNextActionResponse(
            String key,
            String title,
            String description,
            String route,
            String actionLabel,
            String priority
    ) {
    }

    public record OperationalLiveAlertResponse(
            String key,
            String title,
            String message,
            String severity,
            String route,
            String actionLabel,
            LocalDateTime detectedAt
    ) {
    }

    public record OperationalIncidentResponse(
            String key,
            String title,
            String description,
            long count,
            String severity,
            String route,
            String actionLabel
    ) {
    }

    public record OperationalWorkloadResponse(
            String key,
            String title,
            String description,
            long openCount,
            long blockedCount,
            long overdueCount,
            String severity,
            String route
    ) {
    }

    public record OperationalWarehouseCongestionResponse(
            Long warehouseId,
            String warehouseName,
            long inventoryRows,
            String capacityUsedPercent,
            String severity,
            String route
    ) {
    }

    public record OperationalSlaResponse(
            long overdueTasks,
            long delayedTransports,
            long dueSoonTasks,
            long dueSoonTransports,
            String severity
    ) {
    }
}


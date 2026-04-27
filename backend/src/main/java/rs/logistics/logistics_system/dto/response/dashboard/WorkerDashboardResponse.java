package rs.logistics.logistics_system.dto.response.dashboard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record WorkerDashboardResponse(
        long openTasksTotal,
        long todayTasksTotal,
        Map<String, Long> tasksByStatus,
        Map<String, Long> tasksByType,
        WorkerShiftResponse currentShift,
        WorkerShiftResponse nextShift,
        List<WorkerTaskResponse> openTasks,
        List<WorkerTaskResponse> todayTasks
) {
    public record WorkerTaskResponse(
            Long id,
            String title,
            String description,
            String priority,
            String status,
            String taskType,
            LocalDateTime dueDate,
            Long stockMovementId,
            String stockMovementType,
            Long warehouseId,
            String warehouseName,
            Long productId,
            String productName,
            Long transportOrderId,
            String transportOrderNumber
    ) {
    }

    public record WorkerShiftResponse(
            Long id,
            String status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String notes
    ) {
    }
}

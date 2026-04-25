package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CompanyAdminDashboardResponse(
        long employeesTotal,
        long activeEmployees,
        long transportOrdersTotal,
        long activeTransportOrders,
        Map<String, Long> transportOrdersByStatus,
        long tasksTotal,
        long openTasksTotal,
        Map<String, Long> tasksByStatus,
        long vehiclesTotal,
        Map<String, Long> vehiclesByStatus,
        long warehousesTotal,
        long productsTotal,
        long inventoryRowsTotal,
        long lowStockRowsTotal,
        BigDecimal inventoryQuantityTotal,
        BigDecimal inventoryAvailableQuantityTotal,
        long stockMovementsTotal,
        long activityLogsTotal,
        long changeHistoryTotal,
        List<RecentActivityResponse> recentActivities
) {
    public record RecentActivityResponse(
            Long id,
            String action,
            String entityName,
            Long entityId,
            String entityIdentifier,
            String description,
            LocalDateTime createdAt,
            Long userId,
            String userEmail
    ) {
    }
}

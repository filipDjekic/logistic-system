package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DriverDashboardResponse(
        long activeTransportOrders,
        long assignedTransportOrdersTotal,
        Map<String, Long> transportOrdersByStatus,
        long transportTasksTotal,
        long openTransportTasksTotal,
        Map<String, Long> transportTasksByStatus,
        DriverTransportOrderResponse nextTransportOrder,
        List<DriverTransportOrderResponse> activeTransportOrderList,
        List<DriverTaskResponse> transportTasks
) {
    public record DriverTransportOrderResponse(
            Long id,
            String orderNumber,
            String status,
            String priority,
            BigDecimal totalWeight,
            LocalDateTime departureTime,
            LocalDateTime plannedArrivalTime,
            LocalDateTime actualArrivalTime,
            Long sourceWarehouseId,
            String sourceWarehouseName,
            Long destinationWarehouseId,
            String destinationWarehouseName,
            Long vehicleId,
            String vehicleRegistrationNumber,
            String vehicleBrand,
            String vehicleModel,
            String description
    ) {
    }

    public record DriverTaskResponse(
            Long id,
            String title,
            String description,
            String priority,
            String status,
            LocalDateTime dueDate,
            Long transportOrderId,
            String transportOrderNumber,
            String transportOrderStatus
    ) {
    }
}

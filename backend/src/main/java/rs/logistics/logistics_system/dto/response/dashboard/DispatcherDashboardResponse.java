package rs.logistics.logistics_system.dto.response.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DispatcherDashboardResponse(
        long transportOrdersTotal,
        long activeTransportOrders,
        long unassignedTransportOrders,
        Map<String, Long> transportOrdersByStatus,
        long vehiclesTotal,
        long availableVehicles,
        long vehiclesInUse,
        Map<String, Long> vehiclesByStatus,
        long driversTotal,
        long activeDrivers,
        long busyDrivers,
        long availableDrivers,
        long dispatcherTasksTotal,
        long openDispatcherTasksTotal,
        Map<String, Long> dispatcherTasksByStatus,
        List<RecentTransportOrderResponse> recentTransportOrders,
        List<AvailableVehicleResponse> availableVehicleCandidates,
        List<AvailableDriverResponse> availableDriverCandidates
) {
    public record RecentTransportOrderResponse(
            Long id,
            String orderNumber,
            String status,
            String priority,
            BigDecimal totalWeight,
            LocalDateTime departureTime,
            LocalDateTime plannedArrivalTime,
            Long sourceWarehouseId,
            String sourceWarehouseName,
            Long destinationWarehouseId,
            String destinationWarehouseName,
            Long vehicleId,
            String vehicleRegistrationNumber,
            Long assignedEmployeeId,
            String assignedEmployeeName
    ) {
    }

    public record AvailableVehicleResponse(
            Long id,
            String registrationNumber,
            String brand,
            String model,
            String type,
            BigDecimal capacity
    ) {
    }

    public record AvailableDriverResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phoneNumber
    ) {
    }
}

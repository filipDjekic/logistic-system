package rs.logistics.logistics_system.dto.response.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record TransportReportResponse(
        LocalDateTime fromDate,
        LocalDateTime toDate,
        long totalTransports,
        long activeTransports,
        long completedTransports,
        long cancelledTransports,
        BigDecimal totalPlannedWeight,
        BigDecimal completedTransportWeight,
        Map<String, Long> transportsByStatus,
        Map<String, Long> transportsByPriority,
        List<VehicleUsageResponse> vehicleUsage,
        List<DriverUsageResponse> driverUsage,
        List<RouteUsageResponse> routeUsage,
        List<TransportReportRowResponse> rows
) {
    public record VehicleUsageResponse(
            Long vehicleId,
            String registrationNumber,
            String vehicleLabel,
            long transportsTotal,
            long completedTransports,
            BigDecimal totalWeight
    ) {
    }

    public record DriverUsageResponse(
            Long employeeId,
            String driverName,
            String driverEmail,
            long transportsTotal,
            long completedTransports,
            BigDecimal totalWeight
    ) {
    }

    public record RouteUsageResponse(
            Long sourceWarehouseId,
            String sourceWarehouseName,
            Long destinationWarehouseId,
            String destinationWarehouseName,
            long transportsTotal,
            long completedTransports,
            BigDecimal totalWeight
    ) {
    }

    public record TransportReportRowResponse(
            Long id,
            String orderNumber,
            String status,
            String priority,
            BigDecimal totalWeight,
            LocalDateTime orderDate,
            LocalDateTime departureTime,
            LocalDateTime plannedArrivalTime,
            LocalDateTime actualArrivalTime,
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
}

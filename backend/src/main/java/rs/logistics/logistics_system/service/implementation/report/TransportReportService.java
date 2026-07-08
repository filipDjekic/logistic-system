package rs.logistics.logistics_system.service.implementation.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.report.TransportReportResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.report.TransportReportServiceDefinition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class TransportReportService implements TransportReportServiceDefinition {

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = java.util.Arrays.asList(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );

    private static final Set<TransportOrderStatus> TERMINAL_STATUSES = Set.of(
            TransportOrderStatus.DELIVERED,
            TransportOrderStatus.FAILED,
            TransportOrderStatus.CANCELLED
    );

    private final TransportOrderRepository transportOrderRepository;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional(readOnly = true)
    public TransportReportResponse getTransportReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            TransportOrderStatus status,
            PriorityLevel priority,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Long vehicleId,
            Long assignedEmployeeId
    ) {
        validateDateRange(fromDate, toDate);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        validateReportFilters(companyId, sourceWarehouseId, destinationWarehouseId, vehicleId, assignedEmployeeId);

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();
        validateWarehouseFilterAllowedForWarehouseManager(sourceWarehouseId, managedWarehouseIds);
        validateWarehouseFilterAllowedForWarehouseManager(destinationWarehouseId, managedWarehouseIds);

        List<TransportOrder> orders = transportOrderRepository.searchTransportOrders(
                companyId,
                null,
                null,
                false,
                List.of(-1L),
                status,
                priority,
                sourceWarehouseId,
                destinationWarehouseId,
                vehicleId,
                assignedEmployeeId,
                fromDate,
                toDate,
                null,
                Pageable.unpaged()
        ).getContent().stream()
                .filter(order -> isAllowedTransportForWarehouseManager(order, managedWarehouseIds))
                .toList();

        BigDecimal totalPlannedWeight = sumWeight(orders);
        BigDecimal completedTransportWeight = sumWeight(
                orders.stream()
                        .filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED)
                        .toList()
        );

        long completedTransports = orders.stream().filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED).count();
        long cancelledTransports = orders.stream().filter(order -> order.getStatus() == TransportOrderStatus.CANCELLED).count();
        long failedTransports = orders.stream().filter(order -> order.getStatus() == TransportOrderStatus.FAILED).count();
        long delayedTransports = countDelayedTransports(orders);

        return new TransportReportResponse(
                fromDate,
                toDate,
                orders.size(),
                orders.stream().filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus())).count(),
                completedTransports,
                cancelledTransports,
                failedTransports,
                delayedTransports,
                percentage(completedTransports, orders.size()),
                percentage(cancelledTransports, orders.size()),
                averageDelayMinutes(orders),
                averageTransportDurationMinutes(orders),
                totalPlannedWeight,
                completedTransportWeight,
                countByEnum(orders, TransportOrder::getStatus, TransportOrderStatus.values()),
                countByEnum(orders, TransportOrder::getPriority, PriorityLevel.values()),
                buildVehicleUsage(orders),
                buildDriverUsage(orders),
                buildRouteUsage(orders),
                buildRows(orders)
        );
    }


    @Override
    @Transactional(readOnly = true)
    public byte[] exportTransportReportCsv(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            TransportOrderStatus status,
            PriorityLevel priority,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Long vehicleId,
            Long assignedEmployeeId
    ) {
        TransportReportResponse report = getTransportReport(
                fromDate,
                toDate,
                status,
                priority,
                sourceWarehouseId,
                destinationWarehouseId,
                vehicleId,
                assignedEmployeeId
        );

        List<List<?>> rows = new java.util.ArrayList<>();
        rows.add(java.util.Arrays.asList("Transport report"));
        rows.add(java.util.Arrays.asList("fromDate", report.fromDate(), "toDate", report.toDate()));
        rows.add(java.util.Arrays.asList("totalTransports", report.totalTransports(), "activeTransports", report.activeTransports(), "completedTransports", report.completedTransports(), "cancelledTransports", report.cancelledTransports(), "failedTransports", report.failedTransports(), "delayedTransports", report.delayedTransports()));
        rows.add(java.util.Arrays.asList("deliverySuccessRate", report.deliverySuccessRate(), "cancellationRate", report.cancellationRate(), "averageDelayMinutes", report.averageDelayMinutes(), "averageTransportDurationMinutes", report.averageTransportDurationMinutes()));
        rows.add(java.util.Arrays.asList("totalPlannedWeight", report.totalPlannedWeight(), "completedTransportWeight", report.completedTransportWeight()));

        ReportCsvExportHelper.addSectionTitle(rows, "Transport rows");
        rows.add(java.util.Arrays.asList("id", "orderNumber", "status", "priority", "totalWeight", "orderDate", "departureTime", "plannedArrivalTime", "actualArrivalTime", "sourceWarehouseId", "sourceWarehouseName", "destinationWarehouseId", "destinationWarehouseName", "vehicleId", "vehicleRegistrationNumber", "assignedEmployeeId", "assignedEmployeeName"));
        report.rows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.id(),
                row.orderNumber(),
                row.status(),
                row.priority(),
                row.totalWeight(),
                row.orderDate(),
                row.departureTime(),
                row.plannedArrivalTime(),
                row.actualArrivalTime(),
                row.sourceWarehouseId(),
                row.sourceWarehouseName(),
                row.destinationWarehouseId(),
                row.destinationWarehouseName(),
                row.vehicleId(),
                row.vehicleRegistrationNumber(),
                row.assignedEmployeeId(),
                row.assignedEmployeeName()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Status breakdown");
        ReportCsvExportHelper.addMapRows(rows, report.transportsByStatus(), "status", "count");

        ReportCsvExportHelper.addSectionTitle(rows, "Priority breakdown");
        ReportCsvExportHelper.addMapRows(rows, report.transportsByPriority(), "priority", "count");

        ReportCsvExportHelper.addSectionTitle(rows, "Vehicle usage");
        rows.add(java.util.Arrays.asList("vehicleId", "registrationNumber", "vehicleLabel", "transportsTotal", "completedTransports", "totalWeight"));
        report.vehicleUsage().forEach(row -> rows.add(java.util.Arrays.asList(row.vehicleId(), row.registrationNumber(), row.vehicleLabel(), row.transportsTotal(), row.completedTransports(), row.totalWeight())));

        ReportCsvExportHelper.addSectionTitle(rows, "Driver usage");
        rows.add(java.util.Arrays.asList("employeeId", "driverName", "driverEmail", "transportsTotal", "completedTransports", "totalWeight"));
        report.driverUsage().forEach(row -> rows.add(java.util.Arrays.asList(row.employeeId(), row.driverName(), row.driverEmail(), row.transportsTotal(), row.completedTransports(), row.totalWeight())));

        ReportCsvExportHelper.addSectionTitle(rows, "Route usage");
        rows.add(java.util.Arrays.asList("sourceWarehouseId", "sourceWarehouseName", "destinationWarehouseId", "destinationWarehouseName", "transportsTotal", "completedTransports", "totalWeight"));
        report.routeUsage().forEach(row -> rows.add(java.util.Arrays.asList(row.sourceWarehouseId(), row.sourceWarehouseName(), row.destinationWarehouseId(), row.destinationWarehouseName(), row.transportsTotal(), row.completedTransports(), row.totalWeight())));

        return ReportCsvExportHelper.toCsvBytes(rows);
    }

    private long countDelayedTransports(List<TransportOrder> orders) {
        LocalDateTime now = LocalDateTime.now();
        return orders.stream()
                .filter(order -> order.getPlannedArrivalTime() != null)
                .filter(order -> {
                    if (order.getActualArrivalTime() != null) {
                        return order.getActualArrivalTime().isAfter(order.getPlannedArrivalTime());
                    }
                    return !TERMINAL_STATUSES.contains(order.getStatus()) && now.isAfter(order.getPlannedArrivalTime());
                })
                .count();
    }

    private BigDecimal averageDelayMinutes(List<TransportOrder> orders) {
        List<Long> delays = orders.stream()
                .filter(order -> order.getPlannedArrivalTime() != null && order.getActualArrivalTime() != null)
                .filter(order -> order.getActualArrivalTime().isAfter(order.getPlannedArrivalTime()))
                .map(order -> Duration.between(order.getPlannedArrivalTime(), order.getActualArrivalTime()).toMinutes())
                .toList();

        if (delays.isEmpty()) {
            return BigDecimal.ZERO;
        }

        long total = delays.stream().mapToLong(Long::longValue).sum();
        return BigDecimal.valueOf(total).divide(BigDecimal.valueOf(delays.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal averageTransportDurationMinutes(List<TransportOrder> orders) {
        List<Long> durations = orders.stream()
                .filter(order -> order.getDepartureTime() != null && order.getActualArrivalTime() != null)
                .filter(order -> !order.getActualArrivalTime().isBefore(order.getDepartureTime()))
                .map(order -> Duration.between(order.getDepartureTime(), order.getActualArrivalTime()).toMinutes())
                .toList();

        if (durations.isEmpty()) {
            return BigDecimal.ZERO;
        }

        long total = durations.stream().mapToLong(Long::longValue).sum();
        return BigDecimal.valueOf(total).divide(BigDecimal.valueOf(durations.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(long part, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private void validateReportFilters(Long companyId, Long sourceWarehouseId, Long destinationWarehouseId, Long vehicleId, Long assignedEmployeeId) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        if (sourceWarehouseId != null && warehouseRepository.findByIdAndCompany_Id(sourceWarehouseId, companyId).isEmpty()) {
            throw new ForbiddenException("Source warehouse is outside authenticated company scope");
        }

        if (destinationWarehouseId != null && warehouseRepository.findByIdAndCompany_Id(destinationWarehouseId, companyId).isEmpty()) {
            throw new ForbiddenException("Destination warehouse is outside authenticated company scope");
        }

        if (vehicleId != null && !transportOrderRepository.existsVehicleInCompany(vehicleId, companyId)) {
            throw new ForbiddenException("Vehicle is outside authenticated company scope");
        }

        if (assignedEmployeeId != null && employeeRepository.findByIdAndCompany_Id(assignedEmployeeId, companyId).isEmpty()) {
            throw new ForbiddenException("Assigned employee is outside authenticated company scope");
        }
    }

    private Set<Long> resolveManagedWarehouseIdsForWarehouseManager() {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return Set.of();
        }

        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        return warehouseRepository.findByManagerIdAndCompany_Id(
                        employee.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .stream()
                .map(Warehouse::getId)
                .collect(Collectors.toSet());
    }

    private void validateWarehouseFilterAllowedForWarehouseManager(Long warehouseId, Set<Long> managedWarehouseIds) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || warehouseId == null) {
            return;
        }

        if (!managedWarehouseIds.contains(warehouseId)) {
            throw new ForbiddenException("WAREHOUSE_MANAGER can report only managed warehouses");
        }
    }

    private boolean isAllowedTransportForWarehouseManager(TransportOrder order, Set<Long> managedWarehouseIds) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return true;
        }

        Long sourceWarehouseId = order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getId();
        Long destinationWarehouseId = order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getId();

        return managedWarehouseIds.contains(sourceWarehouseId) || managedWarehouseIds.contains(destinationWarehouseId);
    }

    private void validateDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private BigDecimal sumWeight(List<TransportOrder> orders) {
        return orders.stream()
                .map(TransportOrder::getTotalWeight)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private <E extends Enum<E>> Map<String, Long> countByEnum(
            List<TransportOrder> orders,
            Function<TransportOrder, E> extractor,
            E[] values
    ) {
        Map<E, Long> grouped = orders.stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        Map<String, Long> result = new LinkedHashMap<>();
        for (E value : values) {
            result.put(value.name(), grouped.getOrDefault(value, 0L));
        }
        return result;
    }

    private List<TransportReportResponse.VehicleUsageResponse> buildVehicleUsage(List<TransportOrder> orders) {
        return orders.stream()
                .filter(order -> order.getVehicle() != null)
                .collect(Collectors.groupingBy(order -> order.getVehicle().getId()))
                .values()
                .stream()
                .map(group -> {
                    Vehicle vehicle = group.get(0).getVehicle();
                    return new TransportReportResponse.VehicleUsageResponse(
                            vehicle.getId(),
                            vehicle.getRegistrationNumber(),
                            buildVehicleLabel(vehicle),
                            group.size(),
                            group.stream().filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED).count(),
                            sumWeight(group)
                    );
                })
                .sorted(Comparator.comparing(TransportReportResponse.VehicleUsageResponse::transportsTotal).reversed())
                .limit(10)
                .toList();
    }

    private List<TransportReportResponse.DriverUsageResponse> buildDriverUsage(List<TransportOrder> orders) {
        return orders.stream()
                .filter(order -> order.getAssignedEmployee() != null)
                .collect(Collectors.groupingBy(order -> order.getAssignedEmployee().getId()))
                .values()
                .stream()
                .map(group -> {
                    Employee employee = group.get(0).getAssignedEmployee();
                    return new TransportReportResponse.DriverUsageResponse(
                            employee.getId(),
                            employee.getFirstName() + " " + employee.getLastName(),
                            employee.getEmail(),
                            group.size(),
                            group.stream().filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED).count(),
                            sumWeight(group)
                    );
                })
                .sorted(Comparator.comparing(TransportReportResponse.DriverUsageResponse::transportsTotal).reversed())
                .limit(10)
                .toList();
    }

    private List<TransportReportResponse.RouteUsageResponse> buildRouteUsage(List<TransportOrder> orders) {
        return orders.stream()
                .filter(order -> order.getSourceWarehouse() != null && order.getDestinationWarehouse() != null)
                .collect(Collectors.groupingBy(order -> order.getSourceWarehouse().getId() + ":" + order.getDestinationWarehouse().getId()))
                .values()
                .stream()
                .map(group -> {
                    Warehouse source = group.get(0).getSourceWarehouse();
                    Warehouse destination = group.get(0).getDestinationWarehouse();
                    return new TransportReportResponse.RouteUsageResponse(
                            source.getId(),
                            source.getName(),
                            destination.getId(),
                            destination.getName(),
                            group.size(),
                            group.stream().filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED).count(),
                            sumWeight(group)
                    );
                })
                .sorted(Comparator.comparing(TransportReportResponse.RouteUsageResponse::transportsTotal).reversed())
                .limit(10)
                .toList();
    }

    private List<TransportReportResponse.TransportReportRowResponse> buildRows(List<TransportOrder> orders) {
        return orders.stream()
                .sorted(Comparator.comparing(TransportOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(order -> new TransportReportResponse.TransportReportRowResponse(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getStatus() != null ? order.getStatus().name() : null,
                        order.getPriority() != null ? order.getPriority().name() : null,
                        order.getTotalWeight(),
                        order.getOrderDate(),
                        order.getDepartureTime(),
                        order.getPlannedArrivalTime(),
                        order.getActualArrivalTime(),
                        order.getSourceWarehouse() != null ? order.getSourceWarehouse().getId() : null,
                        order.getSourceWarehouse() != null ? order.getSourceWarehouse().getName() : null,
                        order.getDestinationWarehouse() != null ? order.getDestinationWarehouse().getId() : null,
                        order.getDestinationWarehouse() != null ? order.getDestinationWarehouse().getName() : null,
                        order.getVehicle() != null ? order.getVehicle().getId() : null,
                        order.getVehicle() != null ? order.getVehicle().getRegistrationNumber() : null,
                        order.getAssignedEmployee() != null ? order.getAssignedEmployee().getId() : null,
                        order.getAssignedEmployee() != null ? order.getAssignedEmployee().getFirstName() + " " + order.getAssignedEmployee().getLastName() : null
                ))
                .toList();
    }

    private String buildVehicleLabel(Vehicle vehicle) {
        return String.join(" ", java.util.Arrays.asList(
                vehicle.getBrand() != null ? vehicle.getBrand() : "",
                vehicle.getModel() != null ? vehicle.getModel() : ""
        )).trim();
    }
}

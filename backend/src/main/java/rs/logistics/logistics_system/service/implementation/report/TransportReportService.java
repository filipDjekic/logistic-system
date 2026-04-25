package rs.logistics.logistics_system.service.implementation.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.report.TransportReportResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.report.TransportReportServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class TransportReportService implements TransportReportServiceDefinition {

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.IN_TRANSIT
    );

    private final TransportOrderRepository transportOrderRepository;
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

        List<TransportOrder> orders = transportOrderRepository.searchTransportOrders(
                companyId,
                null,
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
        ).getContent();

        BigDecimal totalPlannedWeight = sumWeight(orders);
        BigDecimal completedTransportWeight = sumWeight(
                orders.stream()
                        .filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED)
                        .toList()
        );

        return new TransportReportResponse(
                fromDate,
                toDate,
                orders.size(),
                orders.stream().filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus())).count(),
                orders.stream().filter(order -> order.getStatus() == TransportOrderStatus.DELIVERED).count(),
                orders.stream().filter(order -> order.getStatus() == TransportOrderStatus.CANCELLED).count(),
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
        return String.join(" ", List.of(
                vehicle.getBrand() != null ? vehicle.getBrand() : "",
                vehicle.getModel() != null ? vehicle.getModel() : ""
        )).trim();
    }
}

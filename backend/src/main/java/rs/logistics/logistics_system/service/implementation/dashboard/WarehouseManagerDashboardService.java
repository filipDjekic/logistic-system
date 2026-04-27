package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.WarehouseManagerDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.dashboard.WarehouseManagerDashboardServiceDefinition;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseManagerDashboardService implements WarehouseManagerDashboardServiceDefinition {

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.IN_TRANSIT
    );

    private static final List<TaskStatus> OPEN_TASK_STATUSES = List.of(
            TaskStatus.NEW,
            TaskStatus.IN_PROGRESS
    );

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final TaskRepository taskRepository;
    private final TransportOrderRepository transportOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public WarehouseManagerDashboardResponse getOverview() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee employee = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        if (employee.getPosition() != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new ForbiddenException("Only warehouse managers can access warehouse manager dashboard");
        }

        List<Warehouse> managedWarehouses = warehouseRepository.findByManagerIdAndCompany_Id(employee.getId(), companyId);
        Set<Long> managedWarehouseIds = managedWarehouses.stream()
                .map(Warehouse::getId)
                .collect(Collectors.toCollection(HashSet::new));

        List<WarehouseInventory> inventoryRows = managedWarehouses.stream()
                .flatMap(warehouse -> warehouseInventoryRepository.findByWarehouse_IdAndWarehouse_Company_Id(warehouse.getId(), companyId).stream())
                .toList();

        List<StockMovement> stockMovements = stockMovementRepository.findAllByWarehouse_Company_Id(companyId).stream()
                .filter(movement -> movement.getWarehouse() != null && managedWarehouseIds.contains(movement.getWarehouse().getId()))
                .sorted(Comparator.comparing(StockMovement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<TransportOrder> activeTransportOrders = transportOrderRepository.findAllByCreatedBy_Company_Id(companyId).stream()
                .filter(order -> ACTIVE_TRANSPORT_STATUSES.contains(order.getStatus()))
                .filter(order -> warehouseAffectsTransport(order, managedWarehouseIds))
                .toList();

        List<Task> warehouseTasks = taskRepository.findAllByAssignedEmployee_Company_Id(companyId).stream()
                .filter(task -> taskAffectsManagedWarehouses(task, managedWarehouseIds))
                .toList();

        return new WarehouseManagerDashboardResponse(
                managedWarehouses.size(),
                inventoryRows.size(),
                inventoryRows.stream().filter(this::isLowStock).count(),
                sumQuantity(inventoryRows),
                sumReservedQuantity(inventoryRows),
                sumAvailableQuantity(inventoryRows),
                stockMovements.size(),
                activeTransportOrders.size(),
                warehouseTasks.size(),
                warehouseTasks.stream().filter(task -> OPEN_TASK_STATUSES.contains(task.getStatus())).count(),
                countTasksByStatus(warehouseTasks),
                buildWarehouseInventorySummaries(managedWarehouses, inventoryRows),
                buildLowStockItems(inventoryRows),
                stockMovements.stream().limit(10).map(this::toRecentStockMovement).toList()
        );
    }

    private boolean warehouseAffectsTransport(TransportOrder order, Set<Long> warehouseIds) {
        Long sourceWarehouseId = order.getSourceWarehouse() == null ? null : order.getSourceWarehouse().getId();
        Long destinationWarehouseId = order.getDestinationWarehouse() == null ? null : order.getDestinationWarehouse().getId();
        return warehouseIds.contains(sourceWarehouseId) || warehouseIds.contains(destinationWarehouseId);
    }

    private boolean taskAffectsManagedWarehouses(Task task, Set<Long> warehouseIds) {
        if (task.getStockMovement() != null && task.getStockMovement().getWarehouse() != null) {
            return warehouseIds.contains(task.getStockMovement().getWarehouse().getId());
        }

        if (task.getTransportOrder() != null) {
            return warehouseAffectsTransport(task.getTransportOrder(), warehouseIds);
        }

        return false;
    }

    private Map<String, Long> countTasksByStatus(List<Task> tasks) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus, Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private List<WarehouseManagerDashboardResponse.WarehouseInventorySummaryResponse> buildWarehouseInventorySummaries(
            List<Warehouse> warehouses,
            List<WarehouseInventory> inventoryRows
    ) {
        return warehouses.stream()
                .map(warehouse -> {
                    List<WarehouseInventory> warehouseRows = inventoryRows.stream()
                            .filter(row -> row.getWarehouse() != null && warehouse.getId().equals(row.getWarehouse().getId()))
                            .toList();

                    return new WarehouseManagerDashboardResponse.WarehouseInventorySummaryResponse(
                            warehouse.getId(),
                            warehouse.getName(),
                            warehouseRows.size(),
                            warehouseRows.stream().filter(this::isLowStock).count(),
                            sumQuantity(warehouseRows),
                            sumReservedQuantity(warehouseRows),
                            sumAvailableQuantity(warehouseRows)
                    );
                })
                .toList();
    }

    private List<WarehouseManagerDashboardResponse.LowStockItemResponse> buildLowStockItems(List<WarehouseInventory> inventoryRows) {
        return inventoryRows.stream()
                .filter(this::isLowStock)
                .map(row -> new WarehouseManagerDashboardResponse.LowStockItemResponse(
                        row.getWarehouse().getId(),
                        row.getWarehouse().getName(),
                        row.getProduct().getId(),
                        row.getProduct().getName(),
                        safe(row.getQuantity()),
                        safe(row.getReservedQuantity()),
                        row.getAvailableQuantity(),
                        safe(row.getMinStockLevel())
                ))
                .toList();
    }

    private WarehouseManagerDashboardResponse.RecentStockMovementResponse toRecentStockMovement(StockMovement movement) {
        return new WarehouseManagerDashboardResponse.RecentStockMovementResponse(
                movement.getId(),
                movement.getMovementType().name(),
                safe(movement.getQuantity()),
                movement.getReasonCode().name(),
                movement.getReferenceType().name(),
                movement.getReferenceId(),
                movement.getReferenceNumber(),
                movement.getCreatedAt(),
                movement.getWarehouse().getId(),
                movement.getWarehouse().getName(),
                movement.getProduct().getId(),
                movement.getProduct().getName()
        );
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }

    private boolean isLowStock(WarehouseInventory row) {
        return row.getMinStockLevel() != null && row.getAvailableQuantity().compareTo(row.getMinStockLevel()) <= 0;
    }

    private BigDecimal sumQuantity(List<WarehouseInventory> rows) {
        return rows.stream().map(WarehouseInventory::getQuantity).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumReservedQuantity(List<WarehouseInventory> rows) {
        return rows.stream().map(WarehouseInventory::getReservedQuantity).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumAvailableQuantity(List<WarehouseInventory> rows) {
        return rows.stream().map(WarehouseInventory::getAvailableQuantity).map(this::safe).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

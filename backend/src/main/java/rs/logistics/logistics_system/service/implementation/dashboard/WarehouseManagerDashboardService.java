package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.service.implementation.dashboard.cache.DashboardResponseCache;
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
    private final DashboardResponseCache dashboardResponseCache;

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

        return dashboardResponseCache.get("warehouse-manager:" + companyId + ":" + employee.getId(), () -> buildOverview(employee.getId(), companyId));
    }

    private WarehouseManagerDashboardResponse buildOverview(Long employeeId, Long companyId) {
        List<Warehouse> managedWarehouses = warehouseRepository.findByManagerIdAndCompany_Id(employeeId, companyId);
        Set<Long> managedWarehouseIds = managedWarehouses.stream()
                .map(Warehouse::getId)
                .collect(Collectors.toCollection(HashSet::new));

        if (managedWarehouseIds.isEmpty()) {
            Map<String, Long> emptyTasksByStatus = emptyEnumMap(TaskStatus.values());
            return new WarehouseManagerDashboardResponse(
                    0,
                    0,
                    0,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    null,
                    0,
                    0,
                    0,
                    0,
                    emptyTasksByStatus,
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(
                            DashboardResponseFactory.statusChart("warehouseTasksByStatus", "Warehouse tasks by status", emptyTasksByStatus),
                            DashboardResponseFactory.comparisonChart("inventoryHealth", "Inventory health", "Low stock", 0, "Normal", 0)
                    ),
                    List.of(
                            DashboardResponseFactory.lowStockAlert(0),
                            DashboardResponseFactory.openTasksAlert(0),
                            DashboardResponseFactory.activeTransportsAlert(0)
                    )
            );
        }

        long inventoryRowsTotal = warehouseInventoryRepository.countByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId);
        long lowStockRowsTotal = warehouseInventoryRepository.countLowStockRowsByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId);
        BigDecimal quantityTotal = safe(warehouseInventoryRepository.sumQuantityByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId));
        BigDecimal reservedQuantityTotal = safe(warehouseInventoryRepository.sumReservedQuantityByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId));
        BigDecimal availableQuantityTotal = safe(warehouseInventoryRepository.sumAvailableQuantityByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId));
        BigDecimal inventoryValueTotal = safe(warehouseInventoryRepository.sumTotalValueByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId));
        BigDecimal inventoryAverageUnitCost = averageUnitCost(inventoryValueTotal, quantityTotal);
        String inventoryValuationCurrency = resolveCurrency(warehouseInventoryRepository.findByWarehouse_IdInAndWarehouse_Company_Id(managedWarehouseIds, companyId));

        long stockMovementsTotal = stockMovementRepository.countByCompanyIdAndWarehouseIds(companyId, managedWarehouseIds);
        long activeTransportOrdersTotal = transportOrderRepository.countByCompanyIdAndStatusInAndWarehouseIds(companyId, ACTIVE_TRANSPORT_STATUSES, managedWarehouseIds);
        long warehouseTasksTotal = taskRepository.countForManagedWarehouses(companyId, managedWarehouseIds);
        long openWarehouseTasksTotal = taskRepository.countForManagedWarehousesAndStatusIn(companyId, managedWarehouseIds, OPEN_TASK_STATUSES);
        Map<String, Long> warehouseTasksByStatus = countTasksByStatus(companyId, managedWarehouseIds);

        List<Object[]> inventorySummaryRows = warehouseInventoryRepository.aggregateInventoryByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId);
        List<WarehouseInventory> lowStockRows = warehouseInventoryRepository.findTopLowStockRowsByWarehouseIdsAndCompanyId(managedWarehouseIds, companyId, PageRequest.of(0, 10));
        List<StockMovement> recentStockMovements = stockMovementRepository.findRecentByCompanyIdAndWarehouseIds(companyId, managedWarehouseIds, PageRequest.of(0, 10));

        return new WarehouseManagerDashboardResponse(
                managedWarehouses.size(),
                inventoryRowsTotal,
                lowStockRowsTotal,
                quantityTotal,
                reservedQuantityTotal,
                availableQuantityTotal,
                inventoryValueTotal,
                inventoryAverageUnitCost,
                inventoryValuationCurrency,
                stockMovementsTotal,
                activeTransportOrdersTotal,
                warehouseTasksTotal,
                openWarehouseTasksTotal,
                warehouseTasksByStatus,
                buildWarehouseInventorySummaries(managedWarehouses, inventorySummaryRows),
                buildLowStockItems(lowStockRows),
                recentStockMovements.stream().map(this::toRecentStockMovement).toList(),
                List.of(
                        DashboardResponseFactory.statusChart("warehouseTasksByStatus", "Warehouse tasks by status", warehouseTasksByStatus),
                        DashboardResponseFactory.comparisonChart("inventoryHealth", "Inventory health", "Low stock", lowStockRowsTotal, "Normal", Math.max(inventoryRowsTotal - lowStockRowsTotal, 0))
                ),
                List.of(
                        DashboardResponseFactory.lowStockAlert(lowStockRowsTotal),
                        DashboardResponseFactory.openTasksAlert(openWarehouseTasksTotal),
                        DashboardResponseFactory.activeTransportsAlert(activeTransportOrdersTotal)
                )
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

    private Map<String, Long> countTasksByStatus(Long companyId, Set<Long> warehouseIds) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.countGroupedByStatusForManagedWarehouses(companyId, warehouseIds)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private List<WarehouseManagerDashboardResponse.WarehouseInventorySummaryResponse> buildWarehouseInventorySummaries(
            List<Warehouse> warehouses,
            List<Object[]> summaryRows
    ) {
        Map<Long, Object[]> rowsByWarehouseId = summaryRows.stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> row));

        return warehouses.stream()
                .map(warehouse -> {
                    Object[] row = rowsByWarehouseId.get(warehouse.getId());
                    if (row == null) {
                        return new WarehouseManagerDashboardResponse.WarehouseInventorySummaryResponse(
                                warehouse.getId(),
                                warehouse.getName(),
                                0,
                                0,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                null
                        );
                    }

                    return new WarehouseManagerDashboardResponse.WarehouseInventorySummaryResponse(
                            warehouse.getId(),
                            warehouse.getName(),
                            ((Number) row[2]).longValue(),
                            ((Number) row[3]).longValue(),
                            safe((BigDecimal) row[4]),
                            safe((BigDecimal) row[5]),
                            safe((BigDecimal) row[6]),
                            safe((BigDecimal) row[7]),
                            averageUnitCost(safe((BigDecimal) row[7]), safe((BigDecimal) row[4])),
                            null
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

    private BigDecimal averageUnitCost(BigDecimal totalValue, BigDecimal quantity) {
        BigDecimal safeQuantity = safe(quantity);
        if (safeQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return safe(totalValue).divide(safeQuantity, 4, java.math.RoundingMode.HALF_UP);
    }

    private String resolveCurrency(List<WarehouseInventory> rows) {
        java.util.List<String> currencies = rows.stream()
                .map(WarehouseInventory::getCurrency)
                .filter(java.util.Objects::nonNull)
                .filter(value -> !value.isBlank())
                .distinct()
                .limit(2)
                .toList();
        if (currencies.isEmpty()) {
            return null;
        }
        return currencies.size() == 1 ? currencies.get(0) : "MIXED";
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
